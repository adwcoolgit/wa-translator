import { manualTargetContractSchema, type ManualTargetType } from "../../shared/contracts/domAdapter";
import type { ManualPreviewState } from "../../shared/contracts/uiState";

export type ManualTargetSnapshot = ReturnType<typeof manualTargetContractSchema.parse>;

export const DEFAULT_MANUAL_TARGET_TTL_MS = 5 * 60_000;

export const createManualTargetSnapshot = (input: {
  targetSnapshotId: string;
  targetType: ManualTargetType;
  chatScope: string;
  composerState: "empty" | "hasCaret" | "selectedRange" | "draftNoReliableCaret" | "recycled" | "changed";
  sourceExcerpt: string;
  selectionRangeSignal?: string | null;
  createdAt?: number;
  ttlMs?: number;
}): ManualTargetSnapshot => {
  const createdAt = input.createdAt ?? Date.now();
  const ttlMs = input.ttlMs ?? DEFAULT_MANUAL_TARGET_TTL_MS;

  return manualTargetContractSchema.parse({
    targetSnapshotId: input.targetSnapshotId,
    targetType: input.targetType,
    chatScope: input.chatScope,
    composerState: input.composerState,
    sourceExcerpt: input.sourceExcerpt,
    selectionRangeSignal: input.selectionRangeSignal ?? null,
    createdAt,
    expiresAt: createdAt + ttlMs
  });
};

export const hasManualTargetSnapshotExpired = (
  snapshot: ManualTargetSnapshot,
  now = Date.now()
): boolean => snapshot.expiresAt <= now;

export const requiresExplicitApplyConfirmation = (snapshot: ManualTargetSnapshot): boolean =>
  snapshot.targetType === "fullComposer" ||
  snapshot.targetType === "nonEditableSelection" ||
  snapshot.composerState === "changed" ||
  snapshot.composerState === "draftNoReliableCaret";

export const canMutateComposerFromSnapshot = (snapshot: ManualTargetSnapshot): boolean =>
  snapshot.targetType !== "nonEditableSelection" && !hasManualTargetSnapshotExpired(snapshot);

export const getManualTargetLabel = (
  snapshot: ManualTargetSnapshot
): ManualPreviewState["targetLabel"] => {
  switch (snapshot.targetType) {
    case "editableSelection":
      return "Selected composer text";
    case "fullComposer":
      return "Entire composer draft";
    case "caretInsert":
      return "Composer insertion point";
    case "nonEditableSelection":
      return "Selected received message text";
    default:
      return "Manual target";
  }
};

export const getManualDraftProtectionSummary = (
  snapshot: ManualTargetSnapshot
): NonNullable<ManualPreviewState["draftProtectionSummary"]> => {
  switch (snapshot.targetType) {
    case "editableSelection":
      return "Only the selected composer text can be replaced. The rest of your draft stays unchanged.";
    case "fullComposer":
      return "Applying this result replaces the entire composer draft. Review carefully before continuing.";
    case "caretInsert":
      return "Applying this result inserts at the current composer position and keeps the surrounding draft text.";
    case "nonEditableSelection":
      return "WhatsApp messages are never edited in place. This result can only be inserted into the composer as a new draft.";
    default:
      return "Review the current target before applying the translation.";
  }
};

export const getManualTargetStaleReason = (
  snapshot: ManualTargetSnapshot
): NonNullable<ManualPreviewState["staleReason"]> => {
  switch (snapshot.targetType) {
    case "editableSelection":
      return "The selected composer text changed after translation started. Apply is blocked until you translate the latest selection again.";
    case "fullComposer":
      return "The composer draft changed after translation started. Apply is blocked to avoid replacing newer draft text.";
    case "caretInsert":
      return "The composer caret or draft changed after translation started. Apply is blocked to avoid inserting into the wrong place.";
    case "nonEditableSelection":
      return "The selected received message changed or is no longer selected. Apply is blocked to avoid inserting a translation for the wrong message.";
    default:
      return "The target changed after translation started. Apply is blocked until you retry on the latest target.";
  }
};
