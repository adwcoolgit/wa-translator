import { describe, expect, it } from "vitest";

import { createDiagnosticsCollector } from "../../extension/src/diagnostics/diagnosticsCollector";
import { createLocalDataActions } from "../../extension/src/domain/settings/localDataActions";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository,
  SETTINGS_STORAGE_KEY
} from "../../extension/src/domain/settings/settingsRepository";
import { createPersistentStorageSetPayload, PersistentStorageViolationError } from "../../extension/src/shared/storage/persistentStorageGuard";

const createMemorySessionStorageArea = () => {
  const store = new Map<string, unknown>();
  return {
    async get(key: string) {
      return store.has(key) ? { [key]: store.get(key) } : {};
    },
    async set(items: Record<string, unknown>) {
      for (const [key, value] of Object.entries(items)) {
        store.set(key, value);
      }
    },
    async remove(key: string) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    }
  };
};

describe("persistent storage privacy", () => {
  it("rejects source text in persistent payloads", () => {
    expect(() =>
      createPersistentStorageSetPayload({
        sourceText: "hello"
      })
    ).toThrow(PersistentStorageViolationError);
  });

  it("clears session data and diagnostics while preserving saved settings", async () => {
    const storageArea = createMemoryPersistentStorageArea();
    const repository = createSettingsRepository(storageArea);
    const diagnosticsCollector = createDiagnosticsCollector();
    const sessionStorageArea = createMemorySessionStorageArea();
    const actions = createLocalDataActions(repository, diagnosticsCollector, sessionStorageArea);

    await repository.save({ targetLanguage: "ja" });
    await sessionStorageArea.set({ "session.translation": "cached" });
    diagnosticsCollector.record({
      eventId: "evt-1",
      eventType: "setup_started",
      timestamp: Date.now(),
      properties: {
        provider: "codex"
      },
      redactionStatus: "clean",
      error: null
    });

    const result = await actions.clearLocalData();
    const settingsSnapshot = await storageArea.get(SETTINGS_STORAGE_KEY);
    const sessionSnapshot = await sessionStorageArea.get("session.translation");

    expect(result.resetSettings).toBe(false);
    expect(result.settings.targetLanguage).toBe("ja");
    expect(settingsSnapshot[SETTINGS_STORAGE_KEY]).toMatchObject({ targetLanguage: "ja" });
    expect(sessionSnapshot).toEqual({});
    expect(diagnosticsCollector.list()).toEqual([]);
  });
});