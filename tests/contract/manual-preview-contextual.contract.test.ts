import { describe, expect, it } from "vitest";

import {
  getManualDraftProtectionSummary,
  getManualTargetStaleReason,
  createManualTargetSnapshot
} from "../../extension/src/domain/manual/manualTargetSnapshot";
import { buildTranslationUiState } from "../../extension/src/content/rendering/translationActions";
import {
  getManualPreviewApplyLabel,
  getManualPreviewRetryLabel
} from "../../extension/src/preview/manualPreviewMessaging";
import { manualPreviewStateSchema } from "../../extension/src/shared/contracts/uiState";
import { createSanitizedError } from "../../extension/src/domain/errors/sanitizedErrors";

describe("manual preview and contextual UI contracts", () => {
  it("keeps non-editable selections on an insert-only preview path with draft protection copy", () => {
    const snapshot = createManualTargetSnapshot({
      targetSnapshotId: "manual-selection",
      targetType: "nonEditableSelection",
      chatScope: "chat-a",
      composerState: "hasCaret",
      sourceExcerpt: "Hello from bubble"
    });

    const previewState = manualPreviewStateSchema.parse({
      targetType: snapshot.targetType,
      targetChanged: true,
      canApply: false,
      canCopy: true,
      canCancel: true,
      canUndo: false,
      requestState: "stale",
      targetLabel: "Selected received message text",
      targetDescription: "This request targets selected received-message text and can only insert the result into the composer.",
      requestSummary: "Target language: Bahasa Indonesia.",
      statusText: "The captured target changed after translation started. Review the result, then translate the latest target again.",
      applyLabel: getManualPreviewApplyLabel(snapshot.targetType),
      retryLabel: getManualPreviewRetryLabel({
        requestState: "stale",
        error: null,
        targetChanged: true
      }),
      copyLabel: "Copy translation",
      undoLabel: "Undo",
      staleReason: getManualTargetStaleReason(snapshot),
      draftProtectionVisible: true,
      draftProtectionSummary: getManualDraftProtectionSummary(snapshot)
    });

    expect(previewState.applyLabel).toBe("Insert into composer");
    expect(previewState.canApply).toBe(false);
    expect(previewState.retryLabel).toBe("Translate current target again");
    expect(previewState.draftProtectionSummary).toMatch(/never edited in place/i);
    expect(previewState.staleReason).toMatch(/wrong message/i);
  });

  it("keeps on-demand incoming translation idle until the user explicitly requests it", () => {
    const uiState = buildTranslationUiState({
      mode: "onDemand",
      requestState: "idle",
      translation: null,
      error: null,
      translationVisible: false,
      originalVisible: true,
      focusRestorationKey: "anchor-1"
    });

    expect(uiState.requestActionLabel).toBe("Translate this message");
    expect(uiState.copyLabel).toBeNull();
    expect(uiState.retryLabel).toBeNull();
    expect(uiState.statusText).toMatch(/only when you ask/i);
    expect(uiState.focusRestorationKey).toBe("anchor-1");
  });

  it("keeps contextual error copy human-readable instead of surfacing raw provider codes", () => {
    const uiState = buildTranslationUiState({
      mode: "tooltip",
      requestState: "error",
      translation: null,
      error: createSanitizedError("PROVIDER_TIMEOUT"),
      translationVisible: false,
      originalVisible: true,
      focusRestorationKey: "anchor-2"
    });

    expect(uiState.statusText).toMatch(/translation timed out/i);
    expect(uiState.statusText).not.toMatch(/PROVIDER_TIMEOUT/);
    expect(uiState.retryLabel).toBe("Translate again");
  });
});

