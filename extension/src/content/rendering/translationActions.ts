import type { SanitizedTranslationError } from "../../shared/contracts/translation";

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

export const buildTranslationActionState = (input: {
  requestState: "idle" | "queued" | "processing" | "validating" | "success" | "error" | "stale" | "cancelled" | "dropped";
  translation: string | null;
  error: SanitizedTranslationError | null;
  mode: "inline" | "tooltip" | "onDemand" | "off";
}): TranslationActionState => ({
  canCopy: input.requestState === "success" && typeof input.translation === "string" && input.translation.length > 0,
  canRetry: input.requestState === "error" || input.requestState === "stale",
  canHide: input.mode !== "off" && (input.requestState === "success" || input.requestState === "error"),
  canToggleVisibility: input.mode !== "off" && input.requestState === "success",
  canRequestTranslation:
    input.mode === "onDemand" &&
    input.requestState === "idle" &&
    input.translation === null &&
    input.error === null
});

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
