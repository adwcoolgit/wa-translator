import { copyTranslationToClipboard } from "../rendering/translationActions";

export interface ClipboardCopyResult {
  copied: boolean;
  restore: () => Promise<boolean>;
}

export const writeTextWithClipboardFallback = async (text: string): Promise<boolean> =>
  copyTranslationToClipboard(text);

export const copyWithBestEffortRestore = async (text: string): Promise<ClipboardCopyResult> => {
  let previousClipboardText: string | null = null;

  if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
    try {
      previousClipboardText = await navigator.clipboard.readText();
    } catch {
      previousClipboardText = null;
    }
  }

  const copied = await writeTextWithClipboardFallback(text);

  return {
    copied,
    restore: async () => {
      if (!copied || previousClipboardText === null || !navigator.clipboard?.writeText) {
        return false;
      }

      try {
        await navigator.clipboard.writeText(previousClipboardText);
        return true;
      } catch {
        return false;
      }
    }
  };
};
