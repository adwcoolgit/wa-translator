import { manualTargetContractSchema, type ManualTargetType } from "../../shared/contracts/domAdapter";

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
