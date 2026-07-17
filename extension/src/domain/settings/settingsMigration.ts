export const CURRENT_USER_SETTINGS_SCHEMA_VERSION = 2;

const toRecord = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input)
    ? { ...(input as Record<string, unknown>) }
    : {};

const coerceIntegerField = (
  record: Record<string, unknown>,
  key:
    | "undoSeconds"
    | "providerTimeoutSeconds"
    | "queueMaxPending"
    | "providerConcurrency"
    | "sessionCacheTtlMinutes"
): void => {
  const value = record[key];
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    record[key] = Number.parseInt(value, 10);
  }
};

export const migrateUserSettingsInput = (input: unknown): Record<string, unknown> => {
  const migrated = toRecord(input);

  if (migrated.sourceLanguage === "auto-detect") {
    migrated.sourceLanguage = "auto";
  }

  if (migrated.incomingMode === "on-demand") {
    migrated.incomingMode = "onDemand";
  }

  if (typeof migrated.telemetryEnabled !== "boolean" && typeof migrated.telemetryOptIn === "boolean") {
    migrated.telemetryEnabled = migrated.telemetryOptIn;
  }

  if (typeof migrated.providerProfile !== "string" && typeof migrated.providerModelLabel === "string") {
    migrated.providerProfile = migrated.providerModelLabel;
  }

  coerceIntegerField(migrated, "undoSeconds");
  coerceIntegerField(migrated, "providerTimeoutSeconds");
  coerceIntegerField(migrated, "queueMaxPending");
  coerceIntegerField(migrated, "providerConcurrency");
  coerceIntegerField(migrated, "sessionCacheTtlMinutes");

  migrated.schemaVersion = CURRENT_USER_SETTINGS_SCHEMA_VERSION;
  return migrated;
};
