import { describe, expect, it } from "vitest";

import {
  CURRENT_USER_SETTINGS_SCHEMA_VERSION,
  migrateUserSettingsInput
} from "../../../src/domain/settings/settingsMigration";
import { normalizeUserSettings } from "../../../src/domain/settings/userSettings";

describe("settings migration", () => {
  it("upgrades legacy aliases and numeric string fields", () => {
    const migrated = migrateUserSettingsInput({
      schemaVersion: 1,
      sourceLanguage: "auto-detect",
      incomingMode: "on-demand",
      telemetryOptIn: true,
      providerTimeoutSeconds: "45",
      queueMaxPending: "20",
      sessionCacheTtlMinutes: "30"
    });

    expect(migrated.schemaVersion).toBe(CURRENT_USER_SETTINGS_SCHEMA_VERSION);
    expect(migrated.sourceLanguage).toBe("auto");
    expect(migrated.incomingMode).toBe("onDemand");
    expect(migrated.telemetryEnabled).toBe(true);
    expect(migrated.providerTimeoutSeconds).toBe(45);
    expect(migrated.queueMaxPending).toBe(20);
    expect(migrated.sessionCacheTtlMinutes).toBe(30);
  });

  it("normalizes missing settings to safe defaults at the current schema version", () => {
    const settings = normalizeUserSettings({
      schemaVersion: 1,
      targetLanguage: "ja"
    });

    expect(settings.schemaVersion).toBe(CURRENT_USER_SETTINGS_SCHEMA_VERSION);
    expect(settings.targetLanguage).toBe("ja");
    expect(settings.enabled).toBe(true);
    expect(settings.telemetryEnabled).toBe(false);
    expect(settings.incomingMode).toBe("inline");
  });
});
