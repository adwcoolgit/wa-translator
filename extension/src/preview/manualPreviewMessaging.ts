import { z } from "zod";

export const manualPreviewTriggerSourceSchema = z.enum(["command", "action"]);

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
export type ManualPreviewStartMessage = z.infer<typeof manualPreviewStartMessageSchema>;
export type ManualPreviewStartResult = z.infer<typeof manualPreviewStartResultSchema>;
export type ManualPreviewRuntimeMessage = z.infer<typeof manualPreviewRuntimeMessageSchema>;

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
