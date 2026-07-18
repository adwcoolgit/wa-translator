import { z } from "zod";
import { createSanitizedError } from "../domain/errors/sanitizedErrors";
import type { TranslationRequestState } from "../domain/translation/requestState";
import { sanitizedErrorCodeSchema } from "../shared/contracts/diagnostics";
import type { SanitizedTranslationError } from "../shared/contracts/translation";
import { presentRecoverableError } from "../shared/errors/recoverableErrorPresenter";

export const manualPreviewTriggerSourceSchema = z.enum(["command", "action"]);
export const manualPreviewTargetTypeSchema = z.enum([
  "editableSelection",
  "fullComposer",
  "caretInsert",
  "nonEditableSelection"
]);

export const manualPreviewStartMessageSchema = z
  .object({
    type: z.literal("manual.start"),
    payload: z
      .object({
        source: manualPreviewTriggerSourceSchema
      })
      .strict()
  })
  .strict();

export const manualPreviewStartResultSchema = z
  .object({
    type: z.literal("manual.start.result"),
    payload: z
      .object({
        accepted: z.boolean()
      })
      .strict()
  })
  .strict();

export const manualPreviewRuntimeMessageSchema = z.discriminatedUnion("type", [
  manualPreviewStartMessageSchema,
  manualPreviewStartResultSchema
]);

export type ManualPreviewTriggerSource = z.infer<typeof manualPreviewTriggerSourceSchema>;
export type ManualPreviewTargetType = z.infer<typeof manualPreviewTargetTypeSchema>;
export type ManualPreviewStartMessage = z.infer<typeof manualPreviewStartMessageSchema>;
export type ManualPreviewStartResult = z.infer<typeof manualPreviewStartResultSchema>;
export type ManualPreviewRuntimeMessage = z.infer<typeof manualPreviewRuntimeMessageSchema>;

const normalizeRecoverableError = (error: SanitizedTranslationError) => {
  const parsed = sanitizedErrorCodeSchema.safeParse(error.code);
  return createSanitizedError(parsed.success ? parsed.data : "PROVIDER_INVALID_OUTPUT");
};

export const createManualPreviewStartMessage = (
  source: ManualPreviewTriggerSource = "command"
): ManualPreviewStartMessage => ({
  type: "manual.start",
  payload: {
    source
  }
});

export const parseManualPreviewRuntimeMessage = (message: unknown): ManualPreviewRuntimeMessage =>
  manualPreviewRuntimeMessageSchema.parse(message);

export const getManualPreviewApplyLabel = (targetType: ManualPreviewTargetType): string | null => {
  switch (targetType) {
    case "editableSelection":
      return "Replace selection";
    case "fullComposer":
      return "Replace composer";
    case "caretInsert":
      return "Insert at caret";
    case "nonEditableSelection":
      return "Insert into composer";
    default:
      return null;
  }
};

export const getManualPreviewCopyLabel = (): string => "Copy translation";

export const canManualPreviewRetry = (input: {
  requestState: TranslationRequestState;
  error: SanitizedTranslationError | null;
  targetChanged: boolean;
}): boolean => {
  if (input.targetChanged || input.requestState === "stale") {
    return true;
  }

  if (input.requestState !== "error" || !input.error) {
    return false;
  }

  const presentation = presentRecoverableError(normalizeRecoverableError(input.error));
  return (
    presentation.primaryAction.action === "retry" ||
    presentation.secondaryAction?.action === "retry"
  );
};

export const getManualPreviewRetryLabel = (input: {
  requestState: TranslationRequestState;
  error: SanitizedTranslationError | null;
  targetChanged: boolean;
}): string | null =>
  canManualPreviewRetry(input)
    ? input.targetChanged || input.requestState === "stale"
      ? "Translate current target again"
      : "Retry translation"
    : null;

export const getManualPreviewUndoLabel = (): string => "Undo";

export const getManualPreviewResultPlaceholder = (
  requestState: TranslationRequestState
): string => {
  switch (requestState) {
    case "queued":
    case "processing":
      return "Translation result is being prepared for review.";
    case "validating":
      return "Translation result is being validated before apply is enabled.";
    case "stale":
      return "This result is no longer safe to apply to the previous target.";
    case "error":
      return "No translation result is available yet.";
    default:
      return "Translation result will appear here.";
  }
};

export const getManualPreviewStatusText = (input: {
  requestState: TranslationRequestState;
  error: SanitizedTranslationError | null;
  targetChanged: boolean;
}): string => {
  if (input.targetChanged || input.requestState === "stale") {
    return "The captured target changed after translation started. Review the result, then translate the latest target again.";
  }

  switch (input.requestState) {
    case "queued":
      return "Translation request queued for the current target.";
    case "processing":
      return "Translating the captured target now.";
    case "validating":
      return "Checking the latest target before apply is enabled.";
    case "success":
      return "Translation ready for review.";
    case "error":
      return input.error
        ? `Translation paused. ${presentRecoverableError(normalizeRecoverableError(input.error)).title}.`
        : "Translation paused because the current request could not be completed.";
    case "cancelled":
      return "Translation cancelled. No change was made to the chat.";
    case "dropped":
      return "Translation was dropped safely before a result could be shown.";
    default:
      return "Choose a supported WhatsApp target to begin.";
  }
};

