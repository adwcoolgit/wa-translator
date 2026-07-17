// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { ManualUndoService } from "../../../src/domain/manual/manualUndoService";
import type { ComposerMutationSnapshot } from "../../../src/content/manual/composerMutationService";

const createSnapshot = (): ComposerMutationSnapshot => {
  const composerElement = document.createElement("div");
  composerElement.textContent = "Halo Andri";
  document.body.append(composerElement);

  return {
    undoId: "undo-1",
    chatScope: "chat-a",
    composerElement,
    previousText: "Hello Andri",
    previousSelectionStart: 0,
    previousSelectionEnd: 5,
    nextText: "Halo Andri",
    nextSelectionStart: 0,
    nextSelectionEnd: 10
  };
};

describe("ManualUndoService", () => {
  it("restores the previous composer state when the applied text is still unchanged", () => {
    const service = new ManualUndoService();
    const snapshot = createSnapshot();

    service.register(snapshot, 15);

    expect(service.undo(snapshot.undoId, "chat-a")).toBe(true);
    expect(snapshot.composerElement.textContent).toBe("Hello Andri");
  });

  it("refuses to undo when the composer was edited after apply", () => {
    const service = new ManualUndoService();
    const snapshot = createSnapshot();

    service.register(snapshot, 15);
    snapshot.composerElement.textContent = "Halo Andri tambahan";

    expect(service.undo(snapshot.undoId, "chat-a")).toBe(false);
    expect(snapshot.composerElement.textContent).toBe("Halo Andri tambahan");
  });
});
