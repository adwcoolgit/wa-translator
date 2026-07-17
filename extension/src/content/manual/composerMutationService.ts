import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import type { ResolvedComposerTarget } from "./composerTargetDetector";

export interface ComposerMutationSnapshot {
  undoId: string;
  chatScope: string;
  composerElement: HTMLElement;
  previousText: string;
  previousSelectionStart: number;
  previousSelectionEnd: number;
  nextText: string;
  nextSelectionStart: number;
  nextSelectionEnd: number;
}

const buildUndoId = (): string => `undo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureTextNode = (composerElement: HTMLElement): Text => {
  const firstTextNode = Array.from(composerElement.childNodes).find(
    (node): node is Text => node.nodeType === Node.TEXT_NODE
  );
  if (firstTextNode) {
    return firstTextNode;
  }

  const textNode = composerElement.ownerDocument.createTextNode(composerElement.textContent ?? "");
  composerElement.replaceChildren(textNode);
  return textNode;
};

const setComposerSelection = (
  composerElement: HTMLElement,
  start: number,
  end: number
): void => {
  const selection = composerElement.ownerDocument.defaultView?.getSelection();
  if (!selection) {
    return;
  }

  const textNode = ensureTextNode(composerElement);
  const safeStart = Math.max(0, Math.min(start, textNode.data.length));
  const safeEnd = Math.max(0, Math.min(end, textNode.data.length));
  const range = composerElement.ownerDocument.createRange();
  range.setStart(textNode, safeStart);
  range.setEnd(textNode, safeEnd);
  selection.removeAllRanges();
  selection.addRange(range);
};

const dispatchInputEvent = (composerElement: HTMLElement): void => {
  composerElement.dispatchEvent(
    new Event("input", {
      bubbles: true
    })
  );
};

const applyComposerText = (
  composerElement: HTMLElement,
  nextText: string,
  selectionStart: number,
  selectionEnd: number
): void => {
  composerElement.textContent = nextText;
  composerElement.focus();
  setComposerSelection(composerElement, selectionStart, selectionEnd);
  dispatchInputEvent(composerElement);
};

export const applyComposerTargetTranslation = (
  target: ResolvedComposerTarget,
  translation: string
): ComposerMutationSnapshot | null => {
  if (
    target.snapshot.composerState === "draftNoReliableCaret" ||
    target.snapshot.composerState === "recycled"
  ) {
    return null;
  }

  const previousText = target.composerText;
  const previousSelectionStart = target.selectionStart;
  const previousSelectionEnd = target.selectionEnd;
  let nextText = previousText;
  let nextSelectionStart = previousSelectionStart;
  let nextSelectionEnd = previousSelectionEnd;

  switch (target.snapshot.targetType) {
    case "editableSelection":
      nextText =
        previousText.slice(0, previousSelectionStart) +
        translation +
        previousText.slice(previousSelectionEnd);
      nextSelectionStart = previousSelectionStart + translation.length;
      nextSelectionEnd = nextSelectionStart;
      break;
    case "fullComposer":
      nextText = translation;
      nextSelectionStart = translation.length;
      nextSelectionEnd = translation.length;
      break;
    case "caretInsert":
      nextText =
        previousText.slice(0, previousSelectionStart) +
        translation +
        previousText.slice(previousSelectionEnd);
      nextSelectionStart = previousSelectionStart + translation.length;
      nextSelectionEnd = nextSelectionStart;
      break;
    default:
      return null;
  }

  applyComposerText(target.composerElement, nextText, nextSelectionStart, nextSelectionEnd);

  return {
    undoId: buildUndoId(),
    chatScope: target.snapshot.chatScope,
    composerElement: target.composerElement,
    previousText,
    previousSelectionStart,
    previousSelectionEnd,
    nextText,
    nextSelectionStart,
    nextSelectionEnd
  };
};

export const restoreComposerMutation = (snapshot: ComposerMutationSnapshot): boolean => {
  if (!snapshot.composerElement.isConnected) {
    return false;
  }

  applyComposerText(
    snapshot.composerElement,
    snapshot.previousText,
    snapshot.previousSelectionStart,
    snapshot.previousSelectionEnd
  );
  return true;
};

export const createInsertionFailedError = () => createSanitizedError("INSERTION_FAILED");
