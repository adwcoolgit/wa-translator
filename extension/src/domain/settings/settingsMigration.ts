export const CURRENT_USER_SETTINGS_SCHEMA_VERSION = 4;

const SUPPORTED_TARGET_LANGUAGE_CODES = new Set(["id", "en", "ms", "zh-CN", "ja", "ko", "ar", "es"]);
const MAX_RECENT_TARGET_LANGUAGES = 5;

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

const normalizeRecentTargetLanguages = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sanitized: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !SUPPORTED_TARGET_LANGUAGE_CODES.has(entry) || sanitized.includes(entry)) {
      continue;
    }

    sanitized.push(entry);
    if (sanitized.length === MAX_RECENT_TARGET_LANGUAGES) {
      break;
    }
  }

  return sanitized;
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
  delete migrated.telemetryOptIn;

  if (typeof migrated.providerProfile !== "string" && typeof migrated.providerModelLabel === "string") {
    migrated.providerProfile = migrated.providerModelLabel;
  }
  delete migrated.providerModelLabel;

  if (
    typeof migrated.providerExecutablePathOverride !== "string" &&
    typeof migrated.providerOverridePath === "string"
  ) {
    migrated.providerExecutablePathOverride = migrated.providerOverridePath;
  }
  delete migrated.providerOverridePath;

  if (typeof migrated.startupBehavior !== "string") {
    if (migrated.restoreEnabledOnStartup === false) {
      migrated.startupBehavior = "startDisabled";
    }

    if (migrated.restoreEnabledOnStartup === true) {
      migrated.startupBehavior = "restoreLastEnabled";
    }
  }
  delete migrated.restoreEnabledOnStartup;

  if (migrated.startupBehavior === "restoreLastSessionEnabled") {
    migrated.startupBehavior = "restoreLastEnabled";
  }

  const recentTargetLanguages = normalizeRecentTargetLanguages(
    migrated.recentTargetLanguages ?? migrated.recentLanguages
  );
  if (recentTargetLanguages) {
    migrated.recentTargetLanguages = recentTargetLanguages;
  }
  delete migrated.recentLanguages;

  if (
    typeof migrated.targetLanguage === "string" &&
    migrated.targetLanguage !== "auto" &&
    !SUPPORTED_TARGET_LANGUAGE_CODES.has(migrated.targetLanguage)
  ) {
    delete migrated.targetLanguage;
  }

  coerceIntegerField(migrated, "undoSeconds");
  coerceIntegerField(migrated, "providerTimeoutSeconds");
  coerceIntegerField(migrated, "queueMaxPending");
  coerceIntegerField(migrated, "providerConcurrency");
  coerceIntegerField(migrated, "sessionCacheTtlMinutes");

  migrated.schemaVersion = CURRENT_USER_SETTINGS_SCHEMA_VERSION;
  return migrated;
};
