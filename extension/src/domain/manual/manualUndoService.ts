import { restoreComposerMutation, type ComposerMutationSnapshot } from "../../content/manual/composerMutationService";

export interface ManualUndoEntry {
  undoId: string;
  expiresAt: number;
  snapshot: ComposerMutationSnapshot;
}

export class ManualUndoService {
  private readonly entries = new Map<string, ManualUndoEntry>();

  private isUndoTargetStillValid(entry: ManualUndoEntry): boolean {
    const currentText = entry.snapshot.composerElement.textContent ?? "";

    return entry.snapshot.composerElement.isConnected && currentText === entry.snapshot.nextText;
  }

  public register(snapshot: ComposerMutationSnapshot, undoSeconds: number): ManualUndoEntry {
    const entry: ManualUndoEntry = {
      undoId: snapshot.undoId,
      expiresAt: Date.now() + undoSeconds * 1000,
      snapshot
    };

    this.entries.set(entry.undoId, entry);
    return entry;
  }

  public get(undoId: string): ManualUndoEntry | null {
    const entry = this.entries.get(undoId) ?? null;
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(undoId);
      return null;
    }

    return entry;
  }

  public undo(undoId: string, currentChatScope: string): boolean {
    const entry = this.get(undoId);
    if (!entry || entry.snapshot.chatScope !== currentChatScope) {
      return false;
    }

    if (!this.isUndoTargetStillValid(entry)) {
      this.entries.delete(undoId);
      return false;
    }

    const restored = restoreComposerMutation(entry.snapshot);
    if (restored) {
      this.entries.delete(undoId);
    }

    return restored;
  }

  public clear(): void {
    this.entries.clear();
  }
}

export const createManualUndoService = (): ManualUndoService => new ManualUndoService();
