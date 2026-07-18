import { describe, expect, it } from "vitest";

import { DiagnosticsCollector } from "../../../src/diagnostics/diagnosticsCollector";
import {
  createLocalDataActions,
  getLocalDataActionDefinition,
  listLocalDataActionDefinitions
} from "../../../src/domain/settings/localDataActions";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository
} from "../../../src/domain/settings/settingsRepository";

describe("local data actions", () => {
  it("describes separate destructive actions", () => {
    expect(getLocalDataActionDefinition("clearLocalData").resetSettings).toBe(false);
    expect(getLocalDataActionDefinition("resetSettings").resetSettings).toBe(true);
    expect(listLocalDataActionDefinitions()).toHaveLength(2);
  });

  it("clears session data without resetting saved settings", async () => {
    const storageArea = createMemoryPersistentStorageArea();
    const sessionStorageArea = createMemoryPersistentStorageArea();
    const settingsRepository = createSettingsRepository(storageArea);
    const diagnosticsCollector = new DiagnosticsCollector();
    const localDataActions = createLocalDataActions(
      settingsRepository,
      diagnosticsCollector,
      sessionStorageArea
    );

    await settingsRepository.initialize();
    await sessionStorageArea.set({ pending: true });

    const result = await localDataActions.clearLocalData();

    expect(result.actionId).toBe("clearLocalData");
    expect(result.resetSettings).toBe(false);
    expect(result.settings.enabled).toBe(true);
    expect(await sessionStorageArea.get("pending")).toEqual({});
  });
});
