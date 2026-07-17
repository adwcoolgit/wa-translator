import { z } from "zod";

import { onboardingStepSchema } from "../../shared/contracts/uiState";
import { styleIdSchema } from "../../shared/contracts/translation";
import {
  CURRENT_USER_SETTINGS_SCHEMA_VERSION,
  migrateUserSettingsInput
} from "./settingsMigration";

export const USER_SETTINGS_SCHEMA_VERSION = CURRENT_USER_SETTINGS_SCHEMA_VERSION;
export const DEFAULT_PRIVACY_CONSENT_VERSION = "2026-07-14-v0.2";

export const customStyleSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    instruction: z.string().trim().min(1).max(1000),
    isValid: z.boolean()
  })
  .strict();

export const onboardingProgressSchema = z
  .object({
    currentStep: onboardingStepSchema,
    consentAccepted: z.boolean()
  })
  .strict();

export const userSettingsSchema = z
  .object({
    schemaVersion: z.literal(USER_SETTINGS_SCHEMA_VERSION),
    enabled: z.boolean(),
    onboardingStatus: z.enum(["notStarted", "inProgress", "complete", "blocked"]),
    onboardingProgress: onboardingProgressSchema,
    privacyConsentVersion: z.string().trim().min(1),
    uiLanguage: z.string().trim().min(1),
    sourceLanguage: z.string().trim().min(1),
    targetLanguage: z.string().trim().min(1),
    styleId: styleIdSchema,
    customStyle: customStyleSchema.nullable(),
    incomingMode: z.enum(["inline", "tooltip", "onDemand", "off"]),
    manualMode: z.enum(["preview", "directReplace"]),
    undoSeconds: z.number().int().min(5).max(60),
    providerActive: z.enum(["codex", "claude"]),
    providerProfile: z.string().trim().min(1).max(120).nullable(),
    providerTimeoutSeconds: z.number().int().min(5).max(120),
    queueMaxPending: z.number().int().min(1).max(100),
    providerConcurrency: z.number().int().min(1).max(5),
    sessionCacheEnabled: z.boolean(),
    sessionCacheTtlMinutes: z.number().int().min(1).max(60),
    telemetryEnabled: z.boolean(),
    promptContractVersion: z.literal("1.0")
  })
  .strict()
  .superRefine((value, context) => {
    if (value.styleId === "custom" && value.customStyle === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customStyle is required when styleId is custom",
        path: ["customStyle"]
      });
    }
  });

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type PartialUserSettings = Partial<UserSettings>;

export const defaultUserSettings: UserSettings = {
  schemaVersion: USER_SETTINGS_SCHEMA_VERSION,
  enabled: true,
  onboardingStatus: "notStarted",
  onboardingProgress: {
    currentStep: "welcome",
    consentAccepted: false
  },
  privacyConsentVersion: DEFAULT_PRIVACY_CONSENT_VERSION,
  uiLanguage: "id",
  sourceLanguage: "auto",
  targetLanguage: "id",
  styleId: "neutral",
  customStyle: null,
  incomingMode: "inline",
  manualMode: "preview",
  undoSeconds: 15,
  providerActive: "codex",
  providerProfile: null,
  providerTimeoutSeconds: 30,
  queueMaxPending: 50,
  providerConcurrency: 2,
  sessionCacheEnabled: true,
  sessionCacheTtlMinutes: 15,
  telemetryEnabled: false,
  promptContractVersion: "1.0"
};

export const createDefaultUserSettings = (): UserSettings => structuredClone(defaultUserSettings);

export const normalizeUserSettings = (input: unknown): UserSettings => {
  if (input === undefined || input === null) {
    return createDefaultUserSettings();
  }

  return userSettingsSchema.parse({
    ...createDefaultUserSettings(),
    ...migrateUserSettingsInput(input)
  });
};

export const mergeUserSettings = (
  current: UserSettings,
  update: PartialUserSettings
): UserSettings => userSettingsSchema.parse({ ...current, ...update });
