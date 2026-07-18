import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import { translationUiStateSchema, type TranslationUiState } from "../../shared/contracts/uiState";
import { sanitizedErrorCodeSchema } from "../../shared/contracts/diagnostics";
import type { SanitizedTranslationError } from "../../shared/contracts/translation";
import { presentRecoverableError } from "../../shared/errors/recoverableErrorPresenter";

export interface TranslationActionHandlers {
  onCopy?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
  onToggleVisibility?: () => void | Promise<void>;
  onRequestTranslation?: () => void | Promise<void>;
}

export interface TranslationActionState {
  canCopy: boolean;
  canRetry: boolean;
  canHide: boolean;
  canToggleVisibility: boolean;
  canRequestTranslation: boolean;
}

const normalizeRecoverableError = (error: SanitizedTranslationError) => {
  const parsed = sanitizedErrorCodeSchema.safeParse(error.code);
  return createSanitizedError(parsed.success ? parsed.data : "PROVIDER_INVALID_OUTPUT");
};

const getTranslationStatusText = (input: {
  requestState: "idle" | "queued" | "processing" | "validating" | "success" | "error" | "stale" | "cancelled" | "dropped";
  error: SanitizedTranslationError | null;
  mode: "inline" | "tooltip" | "onDemand" | "off";
}): string => {
  switch (input.requestState) {
    case "queued":
      return "Translation queued for this message.";
    case "processing":
      return "Translating this message now.";
    case "validating":
      return "Checking the translation output before it stays visible.";
    case "success":
      return input.mode === "tooltip"
        ? "Translation ready. Open details to review actions."
        : "Translation ready below the original message.";
    case "error":
      return input.error
        ? `Translation paused. ${presentRecoverableError(normalizeRecoverableError(input.error)).title}.`
        : "Translation paused because the request could not be completed.";
    case "stale":
      return "This translation is no longer current because the message or active chat changed.";
    case "cancelled":
      return "Translation cancelled before a result was shown.";
    case "dropped":
      return "Translation was dropped safely because too many requests were pending.";
    default:
      return input.mode === "onDemand"
        ? "Translate this message only when you ask."
        : input.mode === "off"
          ? "Incoming translation is disabled."
          : "Waiting for translation.";
  }
};

export const buildTranslationActionState = (input: {
  requestState: "idle" | "queued" | "processing" | "validating" | "success" | "error" | "stale" | "cancelled" | "dropped";
  translation: string | null;
  error: SanitizedTranslationError | null;
  mode: "inline" | "tooltip" | "onDemand" | "off";
}): TranslationActionState => ({
  canCopy: input.requestState === "success" && typeof input.translation === "string" && input.translation.length > 0,
  canRetry: input.requestState === "error" || input.requestState === "stale",
  canHide: input.mode !== "off" && (input.requestState === "success" || input.requestState === "error" || input.requestState === "stale"),
  canToggleVisibility: input.mode !== "off" && input.requestState === "success",
  canRequestTranslation:
    input.mode === "onDemand" &&
    input.requestState === "idle" &&
    input.translation === null &&
    input.error === null
});

export const buildTranslationUiState = (input: {
  requestState: "idle" | "queued" | "processing" | "validating" | "success" | "error" | "stale" | "cancelled" | "dropped";
  translation: string | null;
  error: SanitizedTranslationError | null;
  mode: "inline" | "tooltip" | "onDemand" | "off";
  translationVisible: boolean;
  originalVisible: boolean;
  focusRestorationKey?: string;
}): TranslationUiState => {
  const actionState = buildTranslationActionState(input);
  const surfaceStatus =
    input.requestState === "success"
      ? "ready"
      : input.requestState === "error"
        ? "error"
        : input.requestState === "stale"
          ? "stale"
          : input.requestState === "queued" || input.requestState === "processing" || input.requestState === "validating"
            ? "loading"
            : input.mode === "off"
              ? "disabled"
              : "ready";

  return translationUiStateSchema.parse({
    mode: input.mode,
    requestState: input.requestState,
    canRetry: actionState.canRetry,
    canCopy: actionState.canCopy,
    canHide: actionState.canHide,
    originalVisible: input.originalVisible,
    translationVisible: input.translationVisible,
    ownerLabel: "WA Translator",
    statusText: getTranslationStatusText(input),
    requestActionLabel: actionState.canRequestTranslation ? "Translate this message" : null,
    copyLabel: actionState.canCopy ? "Copy translation" : null,
    retryLabel: actionState.canRetry ? "Translate again" : null,
    toggleLabel: actionState.canToggleVisibility
      ? (input.translationVisible ? "Show original only" : "Show translation")
      : null,
    hideLabel: actionState.canHide ? "Hide translation" : null,
    surfaceDescription:
      input.mode === "tooltip"
        ? "Extension-owned translation details open in a popover."
        : input.mode === "onDemand"
          ? "Translation starts only after an explicit request."
          : "Extension-owned translation stays separate from the original message.",
    surfaceStatus,
    diagnosticsLinkVisible: Boolean(input.error),
    focusRestorationKey: input.focusRestorationKey
  });
};

export const runTranslationAction = async (action?: (() => void | Promise<void>) | null): Promise<void> => {
  if (!action) {
    return;
  }

  await action();
};

export const copyTranslationToClipboard = async (translation: string): Promise<boolean> => {
  if (!translation.trim()) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(translation);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = translation;
  fallbackInput.setAttribute("readonly", "true");
  fallbackInput.style.position = "fixed";
  fallbackInput.style.left = "-9999px";
  document.body.append(fallbackInput);
  fallbackInput.select();

  try {
    return document.execCommand("copy");
  } finally {
    fallbackInput.remove();
  }
};
