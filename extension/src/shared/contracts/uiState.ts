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

export const surfaceIdSchema = z.enum([
  "popup",
  "onboarding",
  "options",
  "manualPreview",
  "inlineTranslation",
  "translationPopover",
  "recoveryPanel",
  "undoNotice"
]);

export const surfaceStatusSchema = z.enum([
  "ready",
  "loading",
  "blocked",
  "disabled",
  "warning",
  "error",
  "stale"
]);

export const surfaceToneSchema = z.enum(["compact", "elevated", "inline"]);
export const stateBadgeToneSchema = z.enum(["neutral", "info", "ready", "warning", "error"]);
export const surfaceActionEmphasisSchema = z.enum(["primary", "secondary", "tertiary"]);

export const surfaceActionSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    emphasis: surfaceActionEmphasisSchema,
    disabled: z.boolean().optional(),
    statusText: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export const surfaceLinkSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1)
  })
  .strict();

export const stateBadgeSchema = z
  .object({
    label: z.string().trim().min(1),
    tone: stateBadgeToneSchema,
    supportingText: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export const surfacePanelStateSchema = z
  .object({
    surfaceId: surfaceIdSchema,
    status: surfaceStatusSchema,
    tone: surfaceToneSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable(),
    badges: z.array(stateBadgeSchema).max(6),
    primaryAction: surfaceActionSchema.nullable(),
    secondaryActions: z.array(surfaceActionSchema).max(4),
    links: z.array(surfaceLinkSchema).max(4),
    compact: z.boolean()
  })
  .strict();

export const providerPresentationStateSchema = z
  .object({
    selectedProvider: z.enum(["codex", "claude"]),
    readiness: providerStatusSchema,
    autoDetectedPathSummary: z.string().trim().min(1).nullable(),
    manualOverrideState: z.enum(["none", "configured", "invalid", "pendingValidation"]),
    lastHealthCategory: z.string().trim().min(1).nullable(),
    safeProfileSummary: z.string().trim().min(1).nullable(),
    availableActions: z.array(surfaceActionSchema).max(4)
  })
  .strict();

export const popupFooterLinkSchema = surfaceLinkSchema;

export const popupStateSchema = z
  .object({
    enabled: z.boolean(),
    targetLanguage: z.string().trim().min(1),
    styleId: z.string().trim().min(1),
    incomingMode: z.enum(["inline", "tooltip", "onDemand", "off"]),
    shortcutLabel: z.string().trim().min(1).nullable(),
    providerStatus: providerStatusSchema,
    diagnosticsAttentionRequired: z.boolean(),
    hasValidatedSelection: z.boolean(),
    setupState: z.enum(["ready", "required", "blocked"]).optional(),
    recentTargetLanguages: z.array(z.string().trim().min(1)).max(5).optional(),
    manualActionAvailable: z.boolean().optional(),
    providerSummary: providerPresentationStateSchema.optional(),
    stateBadges: z.array(stateBadgeSchema).max(6).optional(),
    footerLinks: z.array(popupFooterLinkSchema).max(4).optional()
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
    syntheticHealthCheckOnly: z.boolean(),
    stepTitle: z.string().trim().min(1).optional(),
    stepDescription: z.string().trim().min(1).optional(),
    blockedReason: z.string().trim().min(1).nullable().optional(),
    completedStepCount: z.number().int().min(0).max(6).optional(),
    activeBadges: z.array(stateBadgeSchema).max(4).optional()
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
    telemetryEnabled: z.boolean(),
    activeGroup: z.enum(["basic", "system", "support"]).optional(),
    hasUnsavedChanges: z.boolean().optional(),
    changedFieldCount: z.number().int().min(0).optional(),
    changedFields: z.array(z.string().trim().min(1)).max(24).optional(),
    recentTargetLanguages: z.array(z.string().trim().min(1)).max(5).optional(),
    destructiveActionPending: z.enum(["clearLocalData", "resetSettings"]).nullable().optional()
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
    translationVisible: z.boolean(),
    ownerLabel: z.string().trim().min(1).optional(),
    statusText: z.string().trim().min(1).optional(),
    requestActionLabel: z.string().trim().min(1).nullable().optional(),
    copyLabel: z.string().trim().min(1).nullable().optional(),
    retryLabel: z.string().trim().min(1).nullable().optional(),
    toggleLabel: z.string().trim().min(1).nullable().optional(),
    hideLabel: z.string().trim().min(1).nullable().optional(),
    surfaceDescription: z.string().trim().min(1).nullable().optional(),
    surfaceStatus: surfaceStatusSchema.optional(),
    activeBadges: z.array(stateBadgeSchema).max(4).optional(),
    diagnosticsLinkVisible: z.boolean().optional(),
    focusRestorationKey: z.string().trim().min(1).optional()
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
    ]),
    targetLabel: z.string().trim().min(1).optional(),
    targetDescription: z.string().trim().min(1).optional(),
    requestSummary: z.string().trim().min(1).optional(),
    statusText: z.string().trim().min(1).optional(),
    applyLabel: z.string().trim().min(1).nullable().optional(),
    retryLabel: z.string().trim().min(1).nullable().optional(),
    copyLabel: z.string().trim().min(1).optional(),
    undoLabel: z.string().trim().min(1).optional(),
    staleReason: z.string().trim().min(1).nullable().optional(),
    draftProtectionVisible: z.boolean().optional(),
    draftProtectionSummary: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type SurfaceId = z.infer<typeof surfaceIdSchema>;
export type SurfaceStatus = z.infer<typeof surfaceStatusSchema>;
export type SurfaceTone = z.infer<typeof surfaceToneSchema>;
export type StateBadgeTone = z.infer<typeof stateBadgeToneSchema>;
export type SurfaceAction = z.infer<typeof surfaceActionSchema>;
export type SurfaceLink = z.infer<typeof surfaceLinkSchema>;
export type StateBadge = z.infer<typeof stateBadgeSchema>;
export type SurfacePanelState = z.infer<typeof surfacePanelStateSchema>;
export type ProviderPresentationState = z.infer<typeof providerPresentationStateSchema>;
export type PopupState = z.infer<typeof popupStateSchema>;
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
export type OptionsSaveState = z.infer<typeof optionsSaveStateSchema>;
export type OptionsState = z.infer<typeof optionsStateSchema>;
export type TranslationUiState = z.infer<typeof translationUiStateSchema>;
export type ManualPreviewState = z.infer<typeof manualPreviewStateSchema>;
