import { describe, expect, it } from "vitest";

import {
  canMutateComposerFromSnapshot,
  createManualTargetSnapshot,
  hasManualTargetSnapshotExpired,
  requiresExplicitApplyConfirmation
} from "../../../src/domain/manual/manualTargetSnapshot";

describe("manualTargetSnapshot", () => {
  it("marks full composer and non-editable targets as requiring explicit confirmation", () => {
    const fullComposer = createManualTargetSnapshot({
      targetSnapshotId: "full-composer",
      targetType: "fullComposer",
      chatScope: "chat-a",
      composerState: "hasCaret",
      sourceExcerpt: "Halo dunia"
    });
    const nonEditable = createManualTargetSnapshot({
      targetSnapshotId: "selection",
      targetType: "nonEditableSelection",
      chatScope: "chat-a",
      composerState: "empty",
      sourceExcerpt: "Hello world"
    });

    expect(requiresExplicitApplyConfirmation(fullComposer)).toBe(true);
    expect(requiresExplicitApplyConfirmation(nonEditable)).toBe(true);
  });

  it("allows editable composer mutation while the snapshot is still valid", () => {
    const snapshot = createManualTargetSnapshot({
      targetSnapshotId: "editable-selection",
      targetType: "editableSelection",
      chatScope: "chat-a",
      composerState: "selectedRange",
      sourceExcerpt: "Hello"
    });

    expect(canMutateComposerFromSnapshot(snapshot)).toBe(true);
    expect(hasManualTargetSnapshotExpired(snapshot, snapshot.createdAt)).toBe(false);
  });

  it("blocks composer mutation after expiry and for non-editable selections", () => {
    const expired = createManualTargetSnapshot({
      targetSnapshotId: "expired",
      targetType: "editableSelection",
      chatScope: "chat-a",
      composerState: "selectedRange",
      sourceExcerpt: "Hello",
      createdAt: 100,
      ttlMs: 10
    });
    const nonEditable = createManualTargetSnapshot({
      targetSnapshotId: "selection",
      targetType: "nonEditableSelection",
      chatScope: "chat-a",
      composerState: "empty",
      sourceExcerpt: "Hello"
    });

    expect(hasManualTargetSnapshotExpired(expired, 111)).toBe(true);
    expect(canMutateComposerFromSnapshot(expired)).toBe(false);
    expect(canMutateComposerFromSnapshot(nonEditable)).toBe(false);
  });
});
