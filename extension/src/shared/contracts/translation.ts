import { z } from "zod";

export const TRANSLATION_CONTRACT_VERSION = "1.0" as const;

export const translationModeSchema = z.enum(["incoming", "manual"]);
export const translationTargetTypeSchema = z.enum([
  "receivedMessage",
  "editableComposer",
  "nonEditableSelection"
]);
export const providerSchema = z.enum(["codex", "claude"]);
export const styleIdSchema = z.enum([
  "neutral",
  "formal",
  "casual",
  "friendly",
  "professional",
  "concise",
  "polite",
  "custom"
]);
export const preserveRuleSchema = z.enum([
  "emoji",
  "urls",
  "names",
  "mentions",
  "lineBreaks",
  "punctuation",
  "formatting",
  "phoneNumbers",
  "orderCodes"
]);

export const translationStyleSchema = z
  .object({
    id: styleIdSchema,
    customInstruction: z.string().trim().min(1).max(1000).nullable()
  })
  .strict();

export const requestSettingsSnapshotSchema = z
  .object({
    incomingMode: z.enum(["inline", "tooltip", "onDemand", "off"]),
    manualMode: z.enum(["preview", "directReplace"]),
    promptContractVersion: z.literal(TRANSLATION_CONTRACT_VERSION)
  })
  .strict();

export const translationRequestSchema = z
  .object({
    contractVersion: z.literal(TRANSLATION_CONTRACT_VERSION),
    requestId: z.string().trim().min(1),
    mode: translationModeSchema,
    targetType: translationTargetTypeSchema,
    sourceText: z.string().min(1).max(12000),
    sourceLanguage: z.string().trim().min(1),
    targetLanguage: z.string().trim().min(1),
    style: translationStyleSchema,
    preserve: z.array(preserveRuleSchema).max(16),
    glossary: z.array(z.string().trim().min(1)).max(0),
    context: z.array(z.string().trim().min(1)).max(0),
    settingsSnapshot: requestSettingsSnapshotSchema,
    outputFormat: z.literal("json")
  })
  .strict()
  .superRefine((value, context) => {
    if (value.style.id !== "custom" && value.style.customInstruction !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customInstruction is only allowed when style id is custom",
        path: ["style", "customInstruction"]
      });
    }

    if (value.targetType !== "receivedMessage" && value.mode !== "manual") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "manual targets require manual mode",
        path: ["mode"]
      });
    }

    if (value.glossary.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "glossary entries are out of scope for production MVP",
        path: ["glossary"]
      });
    }

    if (value.context.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "context is out of scope for production MVP",
        path: ["context"]
      });
    }
  });

export const sanitizedTranslationErrorSchema = z
  .object({
    code: z.string().trim().min(1),
    component: z.enum(["extension", "contentAdapter", "nativeHost", "provider", "installer", "diagnostics"]),
    severity: z.enum(["info", "warning", "blocking", "error"]),
    recoveryAction: z.string().trim().min(1),
    supportCode: z.string().trim().min(1)
  })
  .strict();

export const translationResponseSchema = z
  .object({
    contractVersion: z.literal(TRANSLATION_CONTRACT_VERSION),
    requestId: z.string().trim().min(1),
    status: z.enum(["success", "error"]),
    translation: z.string().min(1).max(12000).nullable(),
    detectedSourceLanguage: z.string().trim().min(1).nullable(),
    provider: providerSchema,
    latencyMs: z.number().int().nonnegative(),
    error: sanitizedTranslationErrorSchema.nullable()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "success") {
      if (value.translation === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "translation is required for successful responses",
          path: ["translation"]
        });
      }

      if (value.error !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "error must be null for successful responses",
          path: ["error"]
        });
      }
    }

    if (value.status === "error") {
      if (value.translation !== null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "translation must be null for error responses",
          path: ["translation"]
        });
      }

      if (value.error === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "error details are required for error responses",
          path: ["error"]
        });
      }
    }
  });

export type TranslationMode = z.infer<typeof translationModeSchema>;
export type TranslationTargetType = z.infer<typeof translationTargetTypeSchema>;
export type ProviderId = z.infer<typeof providerSchema>;
export type StyleId = z.infer<typeof styleIdSchema>;
export type PreserveRule = z.infer<typeof preserveRuleSchema>;
export type TranslationStyle = z.infer<typeof translationStyleSchema>;
export type RequestSettingsSnapshot = z.infer<typeof requestSettingsSnapshotSchema>;
export type TranslationRequest = z.infer<typeof translationRequestSchema>;
export type SanitizedTranslationError = z.infer<typeof sanitizedTranslationErrorSchema>;
export type TranslationResponse = z.infer<typeof translationResponseSchema>;
export type SuccessfulTranslationResponse = TranslationResponse & { status: "success"; translation: string; error: null };
export type FailedTranslationResponse = TranslationResponse & { status: "error"; translation: null; error: SanitizedTranslationError };

export const isSuccessfulTranslationResponse = (
  response: TranslationResponse
): response is SuccessfulTranslationResponse => response.status === "success";

export const isFailedTranslationResponse = (
  response: TranslationResponse
): response is FailedTranslationResponse => response.status === "error";
