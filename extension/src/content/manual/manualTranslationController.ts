import {
  requiresExplicitApplyConfirmation,
  type ManualTargetSnapshot
} from "../../domain/manual/manualTargetSnapshot";
import {
  createManualUndoService,
  type ManualUndoEntry,
  type ManualUndoService
} from "../../domain/manual/manualUndoService";
import {
  createSettingsRepository,
  type SettingsRepository
} from "../../domain/settings/settingsRepository";
import type { UserSettings } from "../../domain/settings/userSettings";
import {
  createManualTranslationDiagnosticsRecorder,
  type ManualTranslationDiagnosticsRecorder
} from "../../diagnostics/manualTranslationDiagnostics";
import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import { buildManualTranslationRequest } from "../../domain/manual/manualTranslationRequestBuilder";
import {
  createExtensionMessage,
  parseExtensionMessage
} from "../../shared/messaging/extensionMessageBus";
import type {
  SanitizedTranslationError,
  TranslationRequest,
  TranslationResponse
} from "../../shared/contracts/translation";
import { copyWithBestEffortRestore } from "./clipboardFallback";
import {
  applyComposerTargetTranslation,
  createInsertionFailedError,
  type ComposerMutationSnapshot
} from "./composerMutationService";
import {
  detectEditableComposerTarget,
  didComposerTargetChange,
  type ResolvedComposerTarget
} from "./composerTargetDetector";
import {
  copyNonEditableTranslationResult,
  createNonEditableInsertionError,
  insertNonEditableTranslationIntoComposer
} from "./nonEditableResultActions";
import {
  detectNonEditableSelectionTarget,
  didNonEditableSelectionChange,
  type ResolvedNonEditableSelectionTarget
} from "./selectionTargetDetector";
import { mountManualPreviewApp, type ManualPreviewHandle } from "../../preview/ManualPreviewApp";
import {
  manualPreviewStartMessageSchema,
  type ManualPreviewStartMessage
} from "../../preview/manualPreviewMessaging";
import { resolveActiveChatScope } from "../whatsapp/messageTextExtractor";

type ManualRuntimeTranslationResponse = {
  type: "translation.response";
  payload: {
    type: "translationResponse";
    protocolVersion: "1.0";
    payload: TranslationResponse;
  };
};

type ManualTarget = ResolvedComposerTarget | ResolvedNonEditableSelectionTarget;

interface ManualTranslationRuntimeGateway {
  translate(request: TranslationRequest): Promise<TranslationResponse>;
}

interface ActiveManualSession {
  target: ManualTarget;
  settings: UserSettings;
  request: TranslationRequest;
  requestState:
    | "idle"
    | "queued"
    | "processing"
    | "validating"
    | "success"
    | "error"
    | "stale"
    | "cancelled"
    | "dropped";
  translation: string | null;
  error: SanitizedTranslationError | null;
  targetChanged: boolean;
}

const createManualRuntimeGateway = (): ManualTranslationRuntimeGateway => ({
  async translate(request) {
    const runtime = typeof chrome === "undefined" ? undefined : chrome.runtime;
    if (!runtime?.sendMessage) {
      return {
        contractVersion: "1.0",
        requestId: request.requestId,
        status: "error",
        translation: null,
        detectedSourceLanguage: null,
        provider: request.provider,
        latencyMs: 0,
        error: createSanitizedError("HOST_NOT_FOUND")
      };
    }

    const rawResponse = (await runtime.sendMessage(
      createExtensionMessage("translation.request", {
        type: "translationRequest",
        protocolVersion: "1.0",
        payload: request
      })
    )) as unknown;

    const parsedMessage = parseExtensionMessage(rawResponse) as ManualRuntimeTranslationResponse;
    if (parsedMessage.type !== "translation.response") {
      throw new Error("Unexpected runtime translation response.");
    }

    return parsedMessage.payload.payload;
  }
});

const createPreviewMount = (rootDocument: Document): ManualPreviewHandle => {
  const mountNode = rootDocument.createElement("div");
  mountNode.dataset.surface = "manual-preview-root";
  rootDocument.body.append(mountNode);

  return mountManualPreviewApp(mountNode, {
    model: {
      open: false,
      sourceText: "",
      translation: null,
      targetType: "editableSelection",
      targetChanged: false,
      canApply: false,
      canCopy: false,
      canCancel: false,
      canUndo: false,
      requestState: "idle",
      error: null,
      applyLabel: null,
      undoLabel: "Undo"
    },
    handlers: {}
  });
};

const isNonEditableTarget = (
  target: ManualTarget
): target is ResolvedNonEditableSelectionTarget =>
  target.snapshot.targetType === "nonEditableSelection";

const getApplyLabel = (target: ManualTarget): string | null => {
  switch (target.snapshot.targetType) {
    case "editableSelection":
      return "Replace selection";
    case "fullComposer":
      return "Replace composer";
    case "caretInsert":
      return "Insert at caret";
    case "nonEditableSelection":
      return "Insert into composer";
    default:
      return null;
  }
};

export class ManualTranslationController {
  private readonly settingsRepository: SettingsRepository;
  private readonly diagnostics: ManualTranslationDiagnosticsRecorder;
  private readonly runtimeGateway: ManualTranslationRuntimeGateway;
  private readonly undoService: ManualUndoService;
  private preview: ManualPreviewHandle | null = null;
  private rootDocument: Document | null = null;
  private session: ActiveManualSession | null = null;
  private activeUndoEntry: ManualUndoEntry | null = null;

  public constructor(input?: {
    settingsRepository?: SettingsRepository;
    diagnostics?: ManualTranslationDiagnosticsRecorder;
    runtimeGateway?: ManualTranslationRuntimeGateway;
    undoService?: ManualUndoService;
  }) {
    this.settingsRepository = input?.settingsRepository ?? createSettingsRepository();
    this.diagnostics = input?.diagnostics ?? createManualTranslationDiagnosticsRecorder();
    this.runtimeGateway = input?.runtimeGateway ?? createManualRuntimeGateway();
    this.undoService = input?.undoService ?? createManualUndoService();
  }

  public async start(rootDocument: Document = document): Promise<void> {
    this.rootDocument = rootDocument;
    this.preview = createPreviewMount(rootDocument);

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        const parsed = manualPreviewStartMessageSchema.safeParse(message);
        if (!parsed.success) {
          return false;
        }

        void this.handleStartMessage(parsed.data);
        sendResponse({
          type: "manual.start.result",
          payload: {
            accepted: true
          }
        });
        return true;
      });
    }

    this.renderPreview();
  }

  public stop(): void {
    this.preview?.unmount();
    this.preview = null;
    this.session = null;
    this.activeUndoEntry = null;
    this.undoService.clear();
  }

  public async requestManualTranslation(): Promise<void> {
    const rootDocument = this.rootDocument ?? document;
    const settings = await this.settingsRepository.load();
    if (!settings.enabled || settings.onboardingStatus !== "complete") {
      return;
    }

    const target =
      detectNonEditableSelectionTarget(rootDocument) ?? detectEditableComposerTarget(rootDocument);
    if (!target) {
      this.openLocalErrorPreview(settings, createSanitizedError("SELECTION_NOT_FOUND"));
      return;
    }

    const sourceText = isNonEditableTarget(target) ? target.selectedText : target.sourceText;
    const request = buildManualTranslationRequest({
      sourceText,
      snapshot: target.snapshot,
      settings
    });

    this.session = {
      target,
      settings,
      request,
      requestState: "processing",
      translation: null,
      error: null,
      targetChanged: false
    };

    this.diagnostics.recordPreviewOpened({
      target: target.snapshot,
      provider: settings.providerActive,
      manualMode: settings.manualMode
    });
    this.diagnostics.recordTranslationRequested({
      target: target.snapshot,
      provider: settings.providerActive
    });
    this.renderPreview();

    const startedAt = Date.now();
    const response = await this.runtimeGateway.translate(request);
    if (!this.session || this.session.request.requestId !== request.requestId) {
      return;
    }

    if (response.status === "error") {
      this.session.requestState = "error";
      const translationError: SanitizedTranslationError = response.error ?? createSanitizedError("PROVIDER_INVALID_OUTPUT");
      this.session.error = translationError;
      this.diagnostics.recordTranslationFailed({
        target: target.snapshot,
        provider: settings.providerActive,
        error: createSanitizedError(translationError.code as Parameters<typeof createSanitizedError>[0])
      });
      this.renderPreview();
      return;
    }

    this.session.requestState = "success";
    this.session.translation = response.translation;
    this.session.targetChanged = this.computeTargetChanged(target, rootDocument);
    this.diagnostics.recordTranslationCompleted({
      target: target.snapshot,
      provider: settings.providerActive,
      latencyMs: Math.max(response.latencyMs, Date.now() - startedAt)
    });

    if (
      !isNonEditableTarget(target) &&
      settings.manualMode === "directReplace" &&
      !requiresExplicitApplyConfirmation(target.snapshot) &&
      !this.session.targetChanged
    ) {
      const applied = this.applyCurrentTranslation();
      if (applied) {
        return;
      }
    }

    this.renderPreview();
  }

  private async handleStartMessage(_message: ManualPreviewStartMessage): Promise<void> {
    void _message;
    await this.requestManualTranslation();
  }

  private openLocalErrorPreview(
    settings: UserSettings,
    error: SanitizedTranslationError
  ): void {
    const snapshot = ({
      targetType: "editableSelection",
      chatScope: resolveActiveChatScope(this.rootDocument ?? document),
      composerState: "empty",
      targetSnapshotId: "selection-not-found",
      sourceExcerpt: "",
      selectionRangeSignal: null,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000
    } satisfies ManualTargetSnapshot);

    this.session = {
      target: {
        snapshot,
        composerElement: (this.rootDocument ?? document).body,
        composerText: "",
        sourceText: "",
        selectionStart: 0,
        selectionEnd: 0
      },
      settings,
      request: buildManualTranslationRequest({
        sourceText: "selection-not-found",
        snapshot,
        settings,
        requestId: `manual-error-${Date.now()}`
      }),
      requestState: "error",
      translation: null,
      error,
      targetChanged: false
    };

    this.renderPreview();
  }

  private computeTargetChanged(target: ManualTarget, rootDocument: Document): boolean {
    if (isNonEditableTarget(target)) {
      return didNonEditableSelectionChange(target, rootDocument);
    }

    return didComposerTargetChange(target, rootDocument);
  }

  private applyCurrentTranslation(): boolean {
    const rootDocument = this.rootDocument ?? document;
    if (!this.session || !this.session.translation) {
      return false;
    }

    if (this.computeTargetChanged(this.session.target, rootDocument)) {
      this.session.targetChanged = true;
      this.renderPreview();
      return false;
    }

    let mutation: ComposerMutationSnapshot | null = null;

    if (isNonEditableTarget(this.session.target)) {
      mutation = insertNonEditableTranslationIntoComposer({
        translation: this.session.translation,
        sourceChatScope: this.session.target.snapshot.chatScope,
        rootDocument
      });
      if (!mutation) {
        this.session.error = createNonEditableInsertionError();
        this.renderPreview();
        return false;
      }
    } else {
      mutation = applyComposerTargetTranslation(this.session.target, this.session.translation);
      if (!mutation) {
        this.session.error = createInsertionFailedError();
        this.renderPreview();
        return false;
      }
    }

    this.activeUndoEntry = this.undoService.register(
      mutation,
      this.session.settings.undoSeconds
    );
    this.diagnostics.recordApply(this.session.target.snapshot);
    this.session.requestState = "success";
    this.session.error = null;
    this.renderPreview(false);
    return true;
  }

  private async copyCurrentTranslation(): Promise<void> {
    if (!this.session?.translation) {
      return;
    }

    if (isNonEditableTarget(this.session.target)) {
      await copyNonEditableTranslationResult(this.session.translation);
      return;
    }

    const copied = await copyWithBestEffortRestore(this.session.translation);
    if (!copied.copied) {
      this.session.error = createSanitizedError("INSERTION_FAILED");
      this.renderPreview();
    }
  }

  private cancelCurrentPreview(): void {
    if (this.session) {
      this.diagnostics.recordCancel(this.session.target.snapshot);
    }

    this.session = null;
    this.renderPreview(false);
  }

  private undoLastMutation(): void {
    if (!this.activeUndoEntry) {
      return;
    }

    const restored = this.undoService.undo(
      this.activeUndoEntry.undoId,
      resolveActiveChatScope(this.rootDocument ?? document)
    );
    if (!restored) {
      return;
    }

    if (this.session) {
      this.diagnostics.recordUndo(this.session.target.snapshot);
    }

    this.activeUndoEntry = null;
    this.renderPreview(false);
  }

  private renderPreview(open = true): void {
    if (!this.preview) {
      return;
    }

    const session = this.session;
    this.preview.update({
      model: {
        open: open && Boolean(session),
        sourceText: session ?
          (isNonEditableTarget(session.target)
            ? session.target.selectedText
            : session.target.sourceText)
          : "",
        translation: session?.translation ?? null,
        targetType: session?.target.snapshot.targetType ?? "editableSelection",
        targetChanged: session?.targetChanged ?? false,
        canApply:
          Boolean(session?.translation) &&
          !session?.targetChanged &&
          session?.requestState === "success",
        canCopy: Boolean(session?.translation),
        canCancel: Boolean(session),
        canUndo: this.activeUndoEntry !== null,
        requestState: session?.requestState ?? "idle",
        error: session?.error ?? null,
        applyLabel: session ? getApplyLabel(session.target) : null,
        undoLabel: "Undo"
      },
      handlers: {
        onApply: () => {
          this.applyCurrentTranslation();
        },
        onCopy: () => this.copyCurrentTranslation(),
        onCancel: () => {
          this.cancelCurrentPreview();
        },
        onUndo: () => {
          this.undoLastMutation();
        }
      }
    });
  }
}

export const createManualTranslationController = (
  input?: ConstructorParameters<typeof ManualTranslationController>[0]
): ManualTranslationController => new ManualTranslationController(input);

