import { z } from "zod";

export const providerStatusSchema = z.enum([
  "unknown",
  "checking",
  "ready",
  "missing",
  "authRequired",
  "timeout",
  "rateLimited",
  "invalidOutput",
  "unsafeConfiguration",
  "versionMismatch",
  "unavailable"
]);

export const popupStateSchema = z
  .object({
    enabled: z.boolean(),
    targetLanguage: z.string().trim().min(1),
    styleId: z.string().trim().min(1),
    incomingMode: z.enum(["inline", "tooltip", "onDemand", "off"]),
    shortcutLabel: z.string().trim().min(1).nullable(),
    providerStatus: providerStatusSchema,
    diagnosticsAttentionRequired: z.boolean(),
    hasValidatedSelection: z.boolean()
  })
  .strict();

export const onboardingStepSchema = z.enum([
  "welcome",
  "privacy",
  "companion",
  "provider",
  "preferences",
  "ready"
]);

export const onboardingStateSchema = z
  .object({
    currentStep: onboardingStepSchema,
    consentAccepted: z.boolean(),
    lifecycleState: z.enum([
      "notDetected",
      "downloadAvailable",
      "downloadStarted",
      "waitingForInstallation",
      "ready",
      "incompatible",
      "registrationFailed",
      "permissionIssue",
      "integrityFailed",
      "uninstallRequired"
    ]),
    providerStatus: providerStatusSchema,
    canContinue: z.boolean(),
    syntheticHealthCheckOnly: z.boolean()
  })
  .strict();

export const optionsSaveStateSchema = z.enum([
  "clean",
  "dirty",
  "saving",
  "saved",
  "validationError",
  "saveFailed"
]);

export const optionsStateSchema = z
  .object({
    activeSection: z.enum([
      "general",
      "translation",
      "styles",
      "provider",
      "shortcuts",
      "privacy",
      "diagnostics",
      "advanced"
    ]),
    saveState: optionsSaveStateSchema,
    hasBlockingValidation: z.boolean(),
    shortcutConflictDetected: z.boolean(),
    telemetryEnabled: z.boolean()
  })
  .strict();

export const translationUiStateSchema = z
  .object({
    mode: z.enum(["inline", "tooltip", "onDemand", "off"]),
    requestState: z.enum([
      "idle",
      "queued",
      "processing",
      "validating",
      "success",
      "error",
      "stale",
      "cancelled",
      "dropped"
    ]),
    canRetry: z.boolean(),
    canCopy: z.boolean(),
    canHide: z.boolean(),
    originalVisible: z.boolean(),
    translationVisible: z.boolean()
  })
  .strict();

export const manualPreviewStateSchema = z
  .object({
    targetType: z.enum(["editableSelection", "fullComposer", "caretInsert", "nonEditableSelection"]),
    targetChanged: z.boolean(),
    canApply: z.boolean(),
    canCopy: z.boolean(),
    canCancel: z.boolean(),
    canUndo: z.boolean(),
    requestState: z.enum([
      "idle",
      "queued",
      "processing",
      "validating",
      "success",
      "error",
      "stale",
      "cancelled",
      "dropped"
    ])
  })
  .strict();

export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type PopupState = z.infer<typeof popupStateSchema>;
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
export type OptionsSaveState = z.infer<typeof optionsSaveStateSchema>;
export type OptionsState = z.infer<typeof optionsStateSchema>;
export type TranslationUiState = z.infer<typeof translationUiStateSchema>;
export type ManualPreviewState = z.infer<typeof manualPreviewStateSchema>;
