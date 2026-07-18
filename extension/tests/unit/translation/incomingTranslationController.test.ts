import { describe, expect, it } from "vitest";

import { shouldDiscardIncomingTranslationResult } from "../../../src/content/translation/incomingTranslationController";
import { buildTranslationUiState } from "../../../src/content/rendering/translationActions";
import { createSanitizedError } from "../../../src/domain/errors/sanitizedErrors";

describe("shouldDiscardIncomingTranslationResult", () => {
  it("discards results when the active chat scope changes", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-b",
        anchorValidity: "valid"
      })
    ).toBe(true);
  });

  it("discards results when the anchor is no longer valid", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-a",
        anchorValidity: "missing"
      })
    ).toBe(true);
  });

  it("keeps results only when the same chat is active and the anchor remains valid", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-a",
        anchorValidity: "valid"
      })
    ).toBe(false);
  });

  it("maps on-demand idle state to an explicit request action instead of starting automatically", () => {
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
  });

  it("maps stale incoming results to retry-first contextual copy", () => {
    const uiState = buildTranslationUiState({
      mode: "tooltip",
      requestState: "stale",
      translation: "Halo",
      error: createSanitizedError("STALE_REQUEST_DISCARDED"),
      translationVisible: true,
      originalVisible: true,
      focusRestorationKey: "anchor-2"
    });

    expect(uiState.statusText).toMatch(/no longer current/i);
    expect(uiState.retryLabel).toBe("Translate again");
    expect(uiState.hideLabel).toBe("Hide translation");
  });
});
