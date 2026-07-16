import { z } from "zod";

export const adapterCompatibilityStateSchema = z.enum([
  "compatible",
  "degraded",
  "incompatible",
  "disabled",
  "updated"
]);

export const domAnchorKindSchema = z.enum([
  "messageText",
  "translationRegion",
  "popoverTrigger",
  "composer"
]);

export const domAnchorValiditySchema = z.enum([
  "valid",
  "missing",
  "recycled",
  "incompatible",
  "disabled"
]);

export const manualTargetTypeSchema = z.enum([
  "editableSelection",
  "fullComposer",
  "caretInsert",
  "nonEditableSelection"
]);

export const composerStateSchema = z.enum([
  "empty",
  "hasCaret",
  "selectedRange",
  "draftNoReliableCaret",
  "recycled",
  "changed"
]);

export const messageFingerprintSchema = z
  .object({
    fingerprintId: z.string().trim().min(1),
    chatScope: z.string().trim().min(1),
    direction: z.enum(["received", "sent"]),
    senderScope: z.string().trim().min(1).nullable(),
    normalizedTextSignal: z.string().trim().min(1),
    structuralSignal: z.string().trim().min(1).nullable(),
    timeSignal: z.string().trim().min(1).nullable(),
    quotedState: z.enum(["none", "hasQuote", "unknown"]),
    adapterVersion: z.string().trim().min(1),
    expiresAt: z.number().int().positive()
  })
  .strict();

export const domAnchorSchema = z
  .object({
    anchorId: z.string().trim().min(1),
    chatScope: z.string().trim().min(1),
    messageFingerprintId: z.string().trim().min(1).nullable(),
    adapterVersion: z.string().trim().min(1),
    kind: domAnchorKindSchema,
    validity: domAnchorValiditySchema
  })
  .strict();

export const manualTargetContractSchema = z
  .object({
    targetSnapshotId: z.string().trim().min(1),
    targetType: manualTargetTypeSchema,
    chatScope: z.string().trim().min(1),
    composerState: composerStateSchema,
    sourceExcerpt: z.string().max(1000),
    selectionRangeSignal: z.string().trim().min(1).nullable(),
    createdAt: z.number().int().positive(),
    expiresAt: z.number().int().positive()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.expiresAt <= value.createdAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "expiresAt must be later than createdAt",
        path: ["expiresAt"]
      });
    }
  });

export type AdapterCompatibilityState = z.infer<typeof adapterCompatibilityStateSchema>;
export type DomAnchorKind = z.infer<typeof domAnchorKindSchema>;
export type DomAnchorValidity = z.infer<typeof domAnchorValiditySchema>;
export type MessageFingerprintContract = z.infer<typeof messageFingerprintSchema>;
export type DomAnchorContract = z.infer<typeof domAnchorSchema>;
export type ManualTargetType = z.infer<typeof manualTargetTypeSchema>;
export type ComposerState = z.infer<typeof composerStateSchema>;
export type ManualTargetContract = z.infer<typeof manualTargetContractSchema>;
