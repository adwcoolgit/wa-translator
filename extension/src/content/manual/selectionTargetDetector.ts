import { createManualTargetSnapshot, type ManualTargetSnapshot } from "../../domain/manual/manualTargetSnapshot";
import { resolveActiveChatScope } from "../whatsapp/messageTextExtractor";
import { detectComposerInsertionTarget, findComposerElement } from "./composerTargetDetector";

export interface ResolvedNonEditableSelectionTarget {
  snapshot: ManualTargetSnapshot;
  selectedText: string;
  selectionRangeSignal: string;
}

const buildSnapshotId = (): string =>
  `manual-selection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildNodePath = (node: Node | null): string => {
  if (!node) {
    return "null";
  }

  const segments: string[] = [];
  let current: Node | null = node;

  while (current && current.parentNode) {
    const index = Array.from(current.parentNode.childNodes).indexOf(current as ChildNode);
    segments.unshift(`${current.nodeName}:${index}`);
    current = current.parentNode;
  }

  return segments.join("/");
};

export const buildNonEditableSelectionSignal = (range: Range, selectedText: string): string =>
  `${buildNodePath(range.startContainer)}:${range.startOffset}|${buildNodePath(range.endContainer)}:${range.endOffset}|${selectedText.length}`;

export const detectNonEditableSelectionTarget = (
  rootDocument: Document = document
): ResolvedNonEditableSelectionTarget | null => {
  const selection = rootDocument.defaultView?.getSelection() ?? null;
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const composerElement = findComposerElement(rootDocument);
  if (composerElement && composerElement.contains(range.commonAncestorContainer)) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    return null;
  }

  const insertionTarget = detectComposerInsertionTarget(rootDocument);
  const selectionRangeSignal = buildNonEditableSelectionSignal(range, selectedText);

  return {
    snapshot: createManualTargetSnapshot({
      targetSnapshotId: buildSnapshotId(),
      targetType: "nonEditableSelection",
      chatScope: resolveActiveChatScope(rootDocument),
      composerState: insertionTarget?.snapshot.composerState ?? "empty",
      sourceExcerpt: selectedText.slice(0, 1000),
      selectionRangeSignal
    }),
    selectedText,
    selectionRangeSignal
  };
};

export const didNonEditableSelectionChange = (
  target: ResolvedNonEditableSelectionTarget,
  rootDocument: Document = document
): boolean => {
  const currentSelection = detectNonEditableSelectionTarget(rootDocument);
  if (!currentSelection) {
    return true;
  }

  return (
    currentSelection.snapshot.chatScope !== target.snapshot.chatScope ||
    currentSelection.selectedText !== target.selectedText ||
    currentSelection.selectionRangeSignal !== target.selectionRangeSignal
  );
};

