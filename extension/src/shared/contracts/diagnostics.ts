import { z } from "zod";

const PROHIBITED_DIAGNOSTICS_PROPERTY_KEYS = new Set([
  "sourcetext",
  "translation",
  "translatedtext",
  "translationtext",
  "messagetext",
  "contactidentity",
  "chatidentity",
  "accountidentifier",
  "credential",
  "credentials",
  "token",
  "rawstderr",
  "fullexecutablepath",
  "messagehash",
  "conversationdomsnapshot"
]);

const validateContentFreeDiagnosticsProperties = (
  properties: Record<string, string | number | boolean | null>,
  context: z.RefinementCtx,
  path: (string | number)[]
): void => {
  for (const key of Object.keys(properties)) {
    if (PROHIBITED_DIAGNOSTICS_PROPERTY_KEYS.has(key.toLowerCase())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `diagnostics property '${key}' is prohibited`,
        path: [...path, key]
      });
    }
  }
};

export const sanitizedErrorCodeSchema = z.enum([
  "HOST_NOT_FOUND",
  "HOST_VERSION_MISMATCH",
  "PROVIDER_NOT_FOUND",
  "PROVIDER_AUTH_REQUIRED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_RATE_LIMIT",
  "PROVIDER_INVALID_OUTPUT",
  "INPUT_TOO_LARGE",
  "DOM_ADAPTER_INCOMPATIBLE",
  "SELECTION_NOT_FOUND",
  "INSERTION_FAILED",
  "CANCELLED",
  "ONBOARDING_REQUIRED",
  "QUEUE_OVERFLOW",
  "STALE_REQUEST_DISCARDED",
  "PROVIDER_UNSAFE_CONFIGURATION",
  "HOST_INTEGRITY_FAILED"
]);

export const sanitizedErrorComponentSchema = z.enum([
  "extension",
  "contentAdapter",
  "nativeHost",
  "provider",
  "installer",
  "diagnostics"
]);

export const sanitizedErrorSeveritySchema = z.enum(["info", "warning", "blocking", "error"]);
export const recoveryActionSchema = z.enum([
  "retry",
  "openDiagnostics",
  "installCompanion",
  "updateCompanion",
  "signInWithCli",
  "selectExecutable",
  "openShortcutSettings",
  "copyResult",
  "returnToChat",
  "dismiss"
]);

export const sanitizedErrorSchema = z
  .object({
    code: sanitizedErrorCodeSchema,
    component: sanitizedErrorComponentSchema,
    severity: sanitizedErrorSeveritySchema,
    recoveryAction: recoveryActionSchema,
    supportCode: z.string().trim().min(1)
  })
  .strict();

export const diagnosticsEventTypeSchema = z.enum([
  "setup_started",
  "setup_completed",
  "provider_health_check",
  "translation_requested",
  "translation_completed",
  "translation_failed",
  "manual_preview_opened",
  "manual_apply",
  "manual_cancel",
  "manual_undo",
  "display_mode_changed",
  "dom_adapter_incompatible"
]);

export const diagnosticsPropertyValueSchema = z.union([
  z.string().trim().min(1),
  z.number(),
  z.boolean(),
  z.null()
]);

export const redactionStatusSchema = z.enum(["clean", "redacted", "blocked"]);

export const diagnosticsEventSchema = z
  .object({
    eventId: z.string().trim().min(1),
    eventType: diagnosticsEventTypeSchema,
    timestamp: z.number().int().positive(),
    properties: z.record(z.string().trim().min(1), diagnosticsPropertyValueSchema),
    redactionStatus: redactionStatusSchema,
    error: sanitizedErrorSchema.nullable().optional()
  })
  .strict()
  .superRefine((value, context) => {
    validateContentFreeDiagnosticsProperties(value.properties, context, ["properties"]);
  });

export const diagnosticsExportSchema = z
  .object({
    exportedAt: z.number().int().positive(),
    extensionVersion: z.string().trim().min(1),
    manifestVersion: z.string().trim().min(1),
    chromeVersion: z.string().trim().min(1),
    osFamily: z.string().trim().min(1),
    nativeHostVersion: z.string().trim().min(1).nullable(),
    protocolVersion: z.string().trim().min(1).nullable(),
    selectedProvider: z.enum(["codex", "claude"]).nullable(),
    settingsSummary: z.record(z.string().trim().min(1), diagnosticsPropertyValueSchema),
    events: z.array(diagnosticsEventSchema)
  })
  .strict()
  .superRefine((value, context) => {
    validateContentFreeDiagnosticsProperties(value.settingsSummary, context, ["settingsSummary"]);
  });

export type SanitizedErrorCode = z.infer<typeof sanitizedErrorCodeSchema>;
export type SanitizedErrorComponent = z.infer<typeof sanitizedErrorComponentSchema>;
export type SanitizedErrorSeverity = z.infer<typeof sanitizedErrorSeveritySchema>;
export type RecoveryAction = z.infer<typeof recoveryActionSchema>;
export type SanitizedError = z.infer<typeof sanitizedErrorSchema>;
export type DiagnosticsEventType = z.infer<typeof diagnosticsEventTypeSchema>;
export type DiagnosticsEvent = z.infer<typeof diagnosticsEventSchema>;
export type DiagnosticsExport = z.infer<typeof diagnosticsExportSchema>;
export type RedactionStatus = z.infer<typeof redactionStatusSchema>;
