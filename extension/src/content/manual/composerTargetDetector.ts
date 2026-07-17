import {
  createManualTargetSnapshot,
  type ManualTargetSnapshot
} from "../../domain/manual/manualTargetSnapshot";
import type { ComposerState } from "../../shared/contracts/domAdapter";
import { resolveActiveChatScope } from "../whatsapp/messageTextExtractor";

export interface ResolvedComposerTarget {
  snapshot: ManualTargetSnapshot;
  composerElement: HTMLElement;
  composerText: string;
  sourceText: string;
  selectionStart: number;
  selectionEnd: number;
}

const COMPOSER_SELECTOR = [
  "[data-testid='composer'][contenteditable='true']",
  "[contenteditable='true'][role='textbox']",
  "[contenteditable='true']"
].join(",");

const buildSnapshotId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const readComposerText = (composerElement: HTMLElement): string =>
  (composerElement.textContent ?? "").replace(/\u00a0/g, " ").replace(/\r/g, "");

export const findComposerElement = (rootDocument: Document = document): HTMLElement | null =>
  rootDocument.querySelector<HTMLElement>(COMPOSER_SELECTOR);

export const getSelectionOffsetsWithin = (
  composerElement: HTMLElement,
  selection: Selection | null = composerElement.ownerDocument.defaultView?.getSelection() ?? null
): { start: number; end: number } | null => {
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const activeRange = selection.getRangeAt(0);
  if (!composerElement.contains(activeRange.commonAncestorContainer)) {
    return null;
  }

  const startRange = activeRange.cloneRange();
  startRange.selectNodeContents(composerElement);
  startRange.setEnd(activeRange.startContainer, activeRange.startOffset);

  const endRange = activeRange.cloneRange();
  endRange.selectNodeContents(composerElement);
  endRange.setEnd(activeRange.endContainer, activeRange.endOffset);

  return {
    start: startRange.toString().length,
    end: endRange.toString().length
  };
};

export const buildSelectionRangeSignal = (
  start: number,
  end: number,
  sourceLength: number
): string => `${start}:${end}:${sourceLength}`;

const createComposerSnapshot = (input: {
  targetType: "editableSelection" | "fullComposer" | "caretInsert";
  composerState: ComposerState;
  chatScope: string;
  sourceExcerpt: string;
  selectionStart: number;
  selectionEnd: number;
}): ManualTargetSnapshot =>
  createManualTargetSnapshot({
    targetSnapshotId: buildSnapshotId(`manual-${input.targetType}`),
    targetType: input.targetType,
    chatScope: input.chatScope,
    composerState: input.composerState,
    sourceExcerpt: input.sourceExcerpt.slice(0, 1000),
    selectionRangeSignal: buildSelectionRangeSignal(input.selectionStart, input.selectionEnd, input.sourceExcerpt.length)
  });

export const detectEditableComposerTarget = (
  rootDocument: Document = document
): ResolvedComposerTarget | null => {
  const composerElement = findComposerElement(rootDocument);
  if (!composerElement) {
    return null;
  }

  const composerText = readComposerText(composerElement);
  if (!composerText.trim()) {
    return null;
  }

  const selectionOffsets = getSelectionOffsetsWithin(composerElement);
  const chatScope = resolveActiveChatScope(rootDocument);

  if (selectionOffsets && selectionOffsets.start !== selectionOffsets.end) {
    const sourceText = composerText.slice(selectionOffsets.start, selectionOffsets.end);

    return {
      snapshot: createComposerSnapshot({
        targetType: "editableSelection",
        composerState: "selectedRange",
        chatScope,
        sourceExcerpt: sourceText,
        selectionStart: selectionOffsets.start,
        selectionEnd: selectionOffsets.end
      }),
      composerElement,
      composerText,
      sourceText,
      selectionStart: selectionOffsets.start,
      selectionEnd: selectionOffsets.end
    };
  }

  const composerState: ComposerState = selectionOffsets ? "hasCaret" : "draftNoReliableCaret";

  return {
    snapshot: createComposerSnapshot({
      targetType: "fullComposer",
      composerState,
      chatScope,
      sourceExcerpt: composerText,
      selectionStart: 0,
      selectionEnd: composerText.length
    }),
    composerElement,
    composerText,
    sourceText: composerText,
    selectionStart: 0,
    selectionEnd: composerText.length
  };
};

export const detectComposerInsertionTarget = (
  rootDocument: Document = document
): ResolvedComposerTarget | null => {
  const composerElement = findComposerElement(rootDocument);
  if (!composerElement) {
    return null;
  }

  const composerText = readComposerText(composerElement);
  const selectionOffsets = getSelectionOffsetsWithin(composerElement);
  const chatScope = resolveActiveChatScope(rootDocument);

  if (!composerText.trim()) {
    return {
      snapshot: createComposerSnapshot({
        targetType: "caretInsert",
        composerState: "empty",
        chatScope,
        sourceExcerpt: "",
        selectionStart: 0,
        selectionEnd: 0
      }),
      composerElement,
      composerText,
      sourceText: "",
      selectionStart: 0,
      selectionEnd: 0
    };
  }

  if (selectionOffsets && selectionOffsets.start !== selectionOffsets.end) {
    const sourceText = composerText.slice(selectionOffsets.start, selectionOffsets.end);

    return {
      snapshot: createComposerSnapshot({
        targetType: "editableSelection",
        composerState: "selectedRange",
        chatScope,
        sourceExcerpt: sourceText,
        selectionStart: selectionOffsets.start,
        selectionEnd: selectionOffsets.end
      }),
      composerElement,
      composerText,
      sourceText,
      selectionStart: selectionOffsets.start,
      selectionEnd: selectionOffsets.end
    };
  }

  if (selectionOffsets) {
    return {
      snapshot: createComposerSnapshot({
        targetType: "caretInsert",
        composerState: "hasCaret",
        chatScope,
        sourceExcerpt: composerText,
        selectionStart: selectionOffsets.start,
        selectionEnd: selectionOffsets.end
      }),
      composerElement,
      composerText,
      sourceText: composerText,
      selectionStart: selectionOffsets.start,
      selectionEnd: selectionOffsets.end
    };
  }

  return {
    snapshot: createComposerSnapshot({
      targetType: "caretInsert",
      composerState: "draftNoReliableCaret",
      chatScope,
      sourceExcerpt: composerText,
      selectionStart: composerText.length,
      selectionEnd: composerText.length
    }),
    composerElement,
    composerText,
    sourceText: composerText,
    selectionStart: composerText.length,
    selectionEnd: composerText.length
  };
};

export const didComposerTargetChange = (
  target: ResolvedComposerTarget,
  rootDocument: Document = document
): boolean => {
  const currentComposerElement = findComposerElement(rootDocument);
  if (!currentComposerElement || currentComposerElement !== target.composerElement) {
    return true;
  }

  if (resolveActiveChatScope(rootDocument) !== target.snapshot.chatScope) {
    return true;
  }

  const currentComposerText = readComposerText(currentComposerElement);
  if (currentComposerText !== target.composerText) {
    return true;
  }

  if (target.snapshot.targetType === "editableSelection") {
    const currentOffsets = getSelectionOffsetsWithin(currentComposerElement);
    const currentSignal = currentOffsets
      ? buildSelectionRangeSignal(currentOffsets.start, currentOffsets.end, currentComposerText.length)
      : null;

    return currentSignal !== target.snapshot.selectionRangeSignal;
  }

  return false;
};
