import { describe, expect, it } from "vitest";

import {
  createMemoryPersistentStorageArea,
  createSettingsRepository,
  SETTINGS_STORAGE_KEY
} from "../../extension/src/domain/settings/settingsRepository";

describe("pre-consent privacy storage", () => {
  it("persists only safe onboarding settings before consent is completed", async () => {
    const storageArea = createMemoryPersistentStorageArea();
    const repository = createSettingsRepository(storageArea);

    await repository.save({ onboardingStatus: "inProgress" });
    const snapshot = await storageArea.get(SETTINGS_STORAGE_KEY);

    expect(snapshot[SETTINGS_STORAGE_KEY]).toMatchObject({
      onboardingStatus: "inProgress"
    });
    expect(JSON.stringify(snapshot)).not.toContain("sourceText");
    expect(JSON.stringify(snapshot)).not.toContain("translation");
  });

  it("rejects unexpected message-like payload fields from being written into persistent settings", async () => {
    const storageArea = createMemoryPersistentStorageArea();
    const repository = createSettingsRepository(storageArea);

    await expect(
      repository.save({
        onboardingStatus: "inProgress",
        sourceText: "hello from whatsapp"
      } as unknown as never)
    ).rejects.toThrow();
  });
});
