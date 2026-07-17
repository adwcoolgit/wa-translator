import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import { buildIncomingMessageFingerprint, createMessageFingerprintService } from "../../domain/translation/messageFingerprintService";
import { createTranslationCacheEntry } from "../../domain/translation/sessionCache";
import { getRequestPriority, type RequestPriority, type TranslationRequestState } from "../../domain/translation/requestState";
import { createTranslationQueue, QueueDispositionError, type TranslationQueue } from "../../domain/translation/translationQueue";
import { createSettingsRepository, type SettingsRepository } from "../../domain/settings/settingsRepository";
import type { UserSettings } from "../../domain/settings/userSettings";
import { createIncomingTranslationDiagnosticsRecorder, type IncomingTranslationDiagnosticsRecorder } from "../../diagnostics/incomingTranslationDiagnostics";
import { sanitizedErrorCodeSchema } from "../../shared/contracts/diagnostics";
import { createExtensionMessage, parseExtensionMessage } from "../../shared/messaging/extensionMessageBus";
import { SessionTranslationCache } from "../../shared/storage/sessionTranslationCache";
import {
  sanitizedTranslationErrorSchema,
  translationRequestSchema,
  type SanitizedTranslationError,
  type TranslationRequest,
  type TranslationResponse
} from "../../shared/contracts/translation";
import type { AdapterCompatibilityState, DomAnchorValidity } from "../../shared/contracts/domAdapter";
import { createTranslationContainer, type TranslationContainerHandle, type TranslationContainerModel } from "../rendering/translationContainer";
import { copyTranslationToClipboard } from "../rendering/translationActions";
import { createTranslationCleanup, type TranslationCleanup } from "./translationCleanup";
import { createDomAnchorRegistry, type DomAnchorRegistry } from "../whatsapp/domAnchorRegistry";
import {
  collectReceivedMessages,
  createFingerprintMetadataForMessage,
  resolveActiveChatScope,
  type ExtractedReceivedMessage
} from "../whatsapp/messageTextExtractor";
import { createWhatsAppObserver, type WhatsAppObserver } from "../whatsapp/whatsappObserver";

const ADAPTER_VERSION = "wa-content-adapter-v0.2";
const MAX_SOURCE_TEXT_LENGTH = 12_000;

type IncomingMode = UserSettings["incomingMode"];

type RuntimeTranslationResponse = {
  type: "translation.response";
  payload: {
    type: "translationResponse";
    protocolVersion: "1.0";
    payload: TranslationResponse;
  };
};

interface TranslationRuntimeGateway {
  translate(request: TranslationRequest): Promise<TranslationResponse>;
}

interface TranslationTaskResult {
  response: TranslationResponse;
  latencyMs: number;
}

interface TranslationUiRecord {
  anchorId: string;
  requestId: string;
  fingerprintId: string;
  chatScope: string;
  mode: IncomingMode;
  messageElement: HTMLElement;
  sourceText: string;
  translation: string | null;
  error: SanitizedTranslationError | null;
  state: TranslationRequestState;
  translationVisible: boolean;
  container: TranslationContainerHandle;
}

const buildRequestId = (messageId: string): string =>
  `incoming-${messageId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const toTranslationError = (
  code:
    | "HOST_NOT_FOUND"
    | "PROVIDER_INVALID_OUTPUT"
    | "STALE_REQUEST_DISCARDED"
    | "QUEUE_OVERFLOW"
    | "CANCELLED"
): SanitizedTranslationError => sanitizedTranslationErrorSchema.parse(createSanitizedError(code));

const toDiagnosticsError = (error: SanitizedTranslationError | null | undefined) => {
  const parsed = sanitizedErrorCodeSchema.safeParse(error?.code ?? "PROVIDER_INVALID_OUTPUT");
  return createSanitizedError(parsed.success ? parsed.data : "PROVIDER_INVALID_OUTPUT");
};

export const shouldDiscardIncomingTranslationResult = (input: {
  requestChatScope: string;
  activeChatScope: string;
  anchorValidity: DomAnchorValidity;
}): boolean => input.requestChatScope !== input.activeChatScope || input.anchorValidity !== "valid";

const createTranslationRuntimeGateway = (): TranslationRuntimeGateway => ({
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
        error: toTranslationError("HOST_NOT_FOUND")
      };
    }

    const rawResponse = (await runtime.sendMessage(
      createExtensionMessage("translation.request", {
        type: "translationRequest",
        protocolVersion: "1.0",
        payload: request
      })
    )) as unknown;

    const parsedMessage = parseExtensionMessage(rawResponse) as RuntimeTranslationResponse;
    if (parsedMessage.type !== "translation.response") {
      throw new Error("Unexpected runtime translation response.");
    }

    return parsedMessage.payload.payload;
  }
});

const buildTranslationRequest = (
  message: Pick<ExtractedReceivedMessage, "messageId" | "sourceText">,
  settings: UserSettings
): TranslationRequest =>
  translationRequestSchema.parse({
    contractVersion: "1.0",
    requestId: buildRequestId(message.messageId),
    provider: settings.providerActive,
    mode: "incoming",
    targetType: "receivedMessage",
    sourceText: message.sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH),
    sourceLanguage: settings.sourceLanguage,
    targetLanguage: settings.targetLanguage,
    style: {
      id: settings.styleId,
      customInstruction:
        settings.styleId === "custom" && settings.customStyle ? settings.customStyle.instruction : null
    },
    preserve: ["emoji", "urls", "names", "mentions", "lineBreaks", "punctuation", "phoneNumbers", "orderCodes"],
    glossary: [],
    context: [],
    settingsSnapshot: {
      incomingMode: settings.incomingMode,
      manualMode: settings.manualMode,
      promptContractVersion: settings.promptContractVersion
    },
    outputFormat: "json"
  });

const buildContainerModel = (
  record: TranslationUiRecord,
  actions: TranslationContainerModel["actions"]
): TranslationContainerModel => ({
  anchorId: record.anchorId,
  mode: record.mode,
  requestState: record.state,
  translation: record.translation,
  error: record.error,
  translationVisible: record.translationVisible,
  originalVisible: true,
  actions
});

export class IncomingTranslationController {
  private readonly settingsRepository: SettingsRepository;
  private readonly diagnostics: IncomingTranslationDiagnosticsRecorder;
  private readonly sessionCache: SessionTranslationCache;
  private readonly runtimeGateway: TranslationRuntimeGateway;
  private readonly registry: DomAnchorRegistry;
  private readonly queue: TranslationQueue<TranslationTaskResult>;
  private readonly fingerprintService = createMessageFingerprintService();
  private readonly records = new Map<string, TranslationUiRecord>();
  private readonly cleanup: TranslationCleanup;
  private observer: WhatsAppObserver | null = null;
  private settings: UserSettings | null = null;
  private activeChatScope = "active-chat";
  private started = false;

  public constructor(input?: {
    settingsRepository?: SettingsRepository;
    diagnostics?: IncomingTranslationDiagnosticsRecorder;
    sessionCache?: SessionTranslationCache;
    runtimeGateway?: TranslationRuntimeGateway;
    registry?: DomAnchorRegistry;
    queue?: TranslationQueue<TranslationTaskResult>;
  }) {
    this.settingsRepository = input?.settingsRepository ?? createSettingsRepository();
    this.diagnostics = input?.diagnostics ?? createIncomingTranslationDiagnosticsRecorder();
    this.sessionCache = input?.sessionCache ?? new SessionTranslationCache();
    this.runtimeGateway = input?.runtimeGateway ?? createTranslationRuntimeGateway();
    this.registry = input?.registry ?? createDomAnchorRegistry();
    this.queue = input?.queue ?? createTranslationQueue(2, 50);
    this.cleanup = createTranslationCleanup(this.registry);
  }

  public async start(rootDocument: Document = document): Promise<void> {
    if (this.started) {
      return;
    }

    this.settings = await this.settingsRepository.load();
    if (!this.settings.enabled || this.settings.onboardingStatus !== "complete") {
      this.registry.setCompatibilityState("disabled");
      this.started = true;
      return;
    }

    this.observer = createWhatsAppObserver(
      {
        processRoot: (root) => {
          void this.processRoot(root);
        },
        handleCompatibilityChange: (state) => {
          this.handleCompatibilityChange(state);
        },
        cleanup: () => {
          this.cleanup.cleanupForCompatibility("incompatible");
          this.records.clear();
        }
      },
      rootDocument
    );

    this.observer.start();
    this.started = true;
  }

  public stop(): void {
    this.observer?.stop();
    this.cleanup.cleanupForDisposal();
    this.records.clear();
    this.started = false;
  }

  public async processRoot(root: ParentNode): Promise<void> {
    const settings = this.settings ?? await this.settingsRepository.load();
    this.settings = settings;

    if (!settings.enabled || settings.onboardingStatus !== "complete") {
      this.handleCompatibilityChange("disabled");
      return;
    }

    if (settings.incomingMode === "off") {
      this.handleCompatibilityChange("disabled");
      return;
    }

    this.registry.cleanupInvalidAnchors();

    const nextChatScope = resolveActiveChatScope(root);
    if (nextChatScope !== this.activeChatScope) {
      this.activeChatScope = nextChatScope;
    }

    this.markRecordsOutsideActiveChatAsStale();

    const messages = collectReceivedMessages(root);
    for (const message of messages) {
      void this.processMessage(message, settings);
    }
  }

  public handleCompatibilityChange(state: AdapterCompatibilityState): void {
    this.registry.setCompatibilityState(state);

    if (state === "compatible") {
      return;
    }

    this.diagnostics.recordCompatibilityState(state);
    this.observer?.stop();
    this.cleanup.cleanupForCompatibility(
      state === "disabled" || state === "updated" ? state : "incompatible"
    );
    this.records.clear();
  }

  private markRecordsOutsideActiveChatAsStale(): void {
    for (const record of this.records.values()) {
      if (record.chatScope === this.activeChatScope) {
        continue;
      }

      const staleIds = this.queue.markStale((task) => task.requestId === record.requestId);
      if (staleIds.length > 0) {
        this.updateRecord(record.anchorId, {
          state: "stale",
          error: toTranslationError("STALE_REQUEST_DISCARDED")
        });
      }
    }
  }

  private async processMessage(message: ExtractedReceivedMessage, settings: UserSettings): Promise<void> {
    const fingerprintMetadata = createFingerprintMetadataForMessage(message);
    const fingerprint = buildIncomingMessageFingerprint({
      chatScope: fingerprintMetadata.chatScope,
      normalizedTextSignal: fingerprintMetadata.normalizedTextSignal,
      structuralSignal: fingerprintMetadata.structuralSignal ?? message.messageId,
      timeSignal: fingerprintMetadata.timeSignal,
      senderScope: fingerprintMetadata.senderScope,
      adapterVersion: ADAPTER_VERSION
    });

    if (!this.fingerprintService.register(fingerprint)) {
      return;
    }

    const anchor = this.registry.registerMessageAnchor({
      chatScope: message.chatScope,
      messageFingerprintId: fingerprint.fingerprintId,
      adapterVersion: ADAPTER_VERSION,
      messageElement: message.messageElement
    });

    const request = buildTranslationRequest(message, settings);
    const record = this.createRecord(anchor.anchorId, fingerprint.fingerprintId, message, settings.incomingMode, request.requestId);

    if (settings.incomingMode === "onDemand") {
      this.renderRecord(record);
      return;
    }

    void this.translateRecord(record.anchorId, request, getRequestPriority({
      mode: "incoming",
      isVisibleChatRequest: message.chatScope === this.activeChatScope
    }));
  }

  private createRecord(
    anchorId: string,
    fingerprintId: string,
    message: ExtractedReceivedMessage,
    mode: IncomingMode,
    requestId: string
  ): TranslationUiRecord {
    const container = createTranslationContainer(message.messageElement, {
      anchorId,
      mode,
      requestState: mode === "onDemand" ? "idle" : "queued",
      translation: null,
      error: null,
      translationVisible: mode !== "tooltip",
      originalVisible: true,
      actions: {}
    });

    this.registry.attachTranslationRegion(anchorId, container.root);

    const record: TranslationUiRecord = {
      anchorId,
      requestId,
      fingerprintId,
      chatScope: message.chatScope,
      mode,
      messageElement: message.messageElement,
      sourceText: message.sourceText,
      translation: null,
      error: null,
      state: mode === "onDemand" ? "idle" : "queued",
      translationVisible: mode !== "tooltip",
      container
    };

    this.records.set(anchorId, record);
    this.renderRecord(record);
    return record;
  }

  private renderRecord(record: TranslationUiRecord): void {
    const actions = {
      onCopy: async () => {
        if (!record.translation) {
          return;
        }

        await copyTranslationToClipboard(record.translation);
      },
      onRetry: async () => {
        const settings = this.settings ?? await this.settingsRepository.load();
        const request = buildTranslationRequest(
          {
            messageId: record.requestId,
            sourceText: record.sourceText
          },
          settings
        );
        record.requestId = request.requestId;
        await this.translateRecord(record.anchorId, request, getRequestPriority({
          mode: "incoming",
          isVisibleChatRequest: record.chatScope === this.activeChatScope
        }));
      },
      onHide: () => {
        record.translationVisible = false;
        this.renderRecord(record);
      },
      onToggleVisibility: () => {
        record.translationVisible = !record.translationVisible;
        this.renderRecord(record);
      },
      onRequestTranslation: async () => {
        const settings = this.settings ?? await this.settingsRepository.load();
        const request = buildTranslationRequest(
          {
            messageId: record.requestId,
            sourceText: record.sourceText
          },
          settings
        );
        record.requestId = request.requestId;
        await this.translateRecord(record.anchorId, request, getRequestPriority({
          mode: "incoming",
          isVisibleChatRequest: record.chatScope === this.activeChatScope
        }));
      }
    };

    record.container.update(buildContainerModel(record, actions));
  }

  private async translateRecord(
    anchorId: string,
    request: TranslationRequest,
    priority: RequestPriority
  ): Promise<void> {
    const record = this.records.get(anchorId);
    if (!record) {
      return;
    }

    this.updateRecord(anchorId, {
      state: "queued",
      error: null
    });
    this.diagnostics.recordTranslationRequested({
      mode: record.mode,
      provider: request.provider,
      priority
    });

    const cached = this.settings?.sessionCacheEnabled ? await this.sessionCache.get(request) : null;
    if (cached) {
      const anchorValidity = this.registry.validateAnchor(anchorId);
      if (shouldDiscardIncomingTranslationResult({
        requestChatScope: record.chatScope,
        activeChatScope: this.activeChatScope,
        anchorValidity
      })) {
        this.updateRecord(anchorId, {
          state: "stale",
          error: toTranslationError("STALE_REQUEST_DISCARDED")
        });
        return;
      }

      this.updateRecord(anchorId, {
        state: "success",
        translation: cached.translation,
        error: null,
        translationVisible: true
      });
      return;
    }

    try {
      const queuedResult = await this.queue.enqueue({
        requestId: request.requestId,
        priority,
        automatic: true,
        run: async () => {
          this.updateRecord(anchorId, {
            state: "processing"
          });

          const startedAt = Date.now();
          const response = await this.runtimeGateway.translate(request);
          return {
            response,
            latencyMs: Math.max(response.latencyMs, Date.now() - startedAt)
          };
        }
      });

      const anchorValidity = this.registry.validateAnchor(anchorId);
      if (shouldDiscardIncomingTranslationResult({
        requestChatScope: record.chatScope,
        activeChatScope: this.activeChatScope,
        anchorValidity
      })) {
        throw new QueueDispositionError("stale", `Anchor ${anchorId} is no longer valid for the active chat.`);
      }

      if (queuedResult.response.status === "success" && queuedResult.response.translation) {
        this.updateRecord(anchorId, {
          state: "success",
          translation: queuedResult.response.translation,
          error: null,
          translationVisible: true
        });

        if (this.settings?.sessionCacheEnabled) {
          await this.sessionCache.set(
            createTranslationCacheEntry(
              request,
              queuedResult.response,
              Date.now(),
              this.settings.sessionCacheTtlMinutes
            )
          );
        }

        this.diagnostics.recordTranslationCompleted({
          mode: record.mode,
          provider: request.provider,
          latencyMs: queuedResult.latencyMs
        });
        return;
      }

      const renderError = queuedResult.response.error ?? toTranslationError("PROVIDER_INVALID_OUTPUT");
      this.updateRecord(anchorId, {
        state: "error",
        error: renderError
      });
      this.diagnostics.recordTranslationFailed({
        mode: record.mode,
        provider: request.provider,
        error: toDiagnosticsError(renderError)
      });
    } catch (error) {
      if (error instanceof QueueDispositionError) {
        this.updateRecord(anchorId, {
          state: error.disposition === "stale" ? "stale" : error.disposition === "cancelled" ? "cancelled" : "dropped",
          error:
            error.disposition === "stale"
              ? toTranslationError("STALE_REQUEST_DISCARDED")
              : error.disposition === "dropped"
                ? toTranslationError("QUEUE_OVERFLOW")
                : toTranslationError("CANCELLED")
        });
        return;
      }

      this.updateRecord(anchorId, {
        state: "error",
        error: toTranslationError("PROVIDER_INVALID_OUTPUT")
      });
    }
  }

  private updateRecord(
    anchorId: string,
    patch: Partial<Pick<TranslationUiRecord, "state" | "translation" | "error" | "translationVisible">>
  ): void {
    const record = this.records.get(anchorId);
    if (!record) {
      return;
    }

    record.state = patch.state ?? record.state;
    if (Object.prototype.hasOwnProperty.call(patch, "translation")) {
      record.translation = patch.translation ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(patch, "error")) {
      record.error = patch.error ?? null;
    }

    if (typeof patch.translationVisible === "boolean") {
      record.translationVisible = patch.translationVisible;
    }

    this.renderRecord(record);
  }
}

export const createIncomingTranslationController = (
  input?: ConstructorParameters<typeof IncomingTranslationController>[0]
): IncomingTranslationController => new IncomingTranslationController(input);
