import { z } from "zod";

import {
  TRANSLATION_CONTRACT_VERSION,
  translationRequestSchema,
  translationResponseSchema
} from "./translation";

export const NATIVE_MESSAGING_PROTOCOL_VERSION = "1.0" as const;

export const nativeHostLifecycleStateSchema = z.enum([
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
]);

export const extensionIdAllowlistStatusSchema = z.enum(["valid", "invalid", "unknown"]);
export const integrityStatusSchema = z.enum(["valid", "invalid", "unknown"]);

export const nativeHandshakeRequestSchema = z
  .object({
    type: z.literal("handshake"),
    extensionVersion: z.string().trim().min(1),
    protocolVersion: z.literal(NATIVE_MESSAGING_PROTOCOL_VERSION),
    extensionId: z.string().trim().min(1)
  })
  .strict();

export const nativeHandshakeResultSchema = z
  .object({
    type: z.literal("handshakeResult"),
    status: z.enum(["ready", "blocked"]),
    hostVersion: z.string().trim().min(1),
    protocolVersion: z.literal(NATIVE_MESSAGING_PROTOCOL_VERSION),
    extensionIdAllowlistStatus: extensionIdAllowlistStatusSchema,
    integrityStatus: integrityStatusSchema
  })
  .strict();

export const nativeLifecycleQuerySchema = z.object({ type: z.literal("lifecycleQuery") }).strict();

export const nativeLifecycleResultSchema = z
  .object({
    type: z.literal("lifecycleResult"),
    state: nativeHostLifecycleStateSchema,
    hostVersion: z.string().trim().min(1).nullable(),
    protocolVersion: z.string().trim().min(1).nullable(),
    extensionIdAllowlistStatus: extensionIdAllowlistStatusSchema,
    integrityStatus: integrityStatusSchema,
    recoveryAction: z.string().trim().min(1).nullable()
  })
  .strict();

export const nativeTranslationRequestMessageSchema = z
  .object({
    type: z.literal("translationRequest"),
    protocolVersion: z.literal(NATIVE_MESSAGING_PROTOCOL_VERSION),
    payload: translationRequestSchema
  })
  .strict()
  .superRefine((value, context) => {
    if (value.payload.contractVersion !== TRANSLATION_CONTRACT_VERSION) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "translation request contract version must match native messaging contract",
        path: ["payload", "contractVersion"]
      });
    }
  });

export const nativeTranslationResponseMessageSchema = z
  .object({
    type: z.literal("translationResponse"),
    protocolVersion: z.literal(NATIVE_MESSAGING_PROTOCOL_VERSION),
    payload: translationResponseSchema
  })
  .strict();

export const nativeErrorMessageSchema = z
  .object({
    type: z.literal("error"),
    protocolVersion: z.literal(NATIVE_MESSAGING_PROTOCOL_VERSION),
    code: z.string().trim().min(1),
    message: z.string().trim().min(1)
  })
  .strict();

export const outboundNativeHostMessageSchema = z.discriminatedUnion("type", [
  nativeHandshakeRequestSchema,
  nativeLifecycleQuerySchema,
  nativeTranslationRequestMessageSchema
]);

export const inboundNativeHostMessageSchema = z.discriminatedUnion("type", [
  nativeHandshakeResultSchema,
  nativeLifecycleResultSchema,
  nativeTranslationResponseMessageSchema,
  nativeErrorMessageSchema
]);

export type NativeHostLifecycleState = z.infer<typeof nativeHostLifecycleStateSchema>;
export type NativeHandshakeRequest = z.infer<typeof nativeHandshakeRequestSchema>;
export type NativeHandshakeResult = z.infer<typeof nativeHandshakeResultSchema>;
export type NativeLifecycleQuery = z.infer<typeof nativeLifecycleQuerySchema>;
export type NativeLifecycleResult = z.infer<typeof nativeLifecycleResultSchema>;
export type NativeTranslationRequestMessage = z.infer<typeof nativeTranslationRequestMessageSchema>;
export type NativeTranslationResponseMessage = z.infer<typeof nativeTranslationResponseMessageSchema>;
export type NativeErrorMessage = z.infer<typeof nativeErrorMessageSchema>;
export type OutboundNativeHostMessage = z.infer<typeof outboundNativeHostMessageSchema>;
export type InboundNativeHostMessage = z.infer<typeof inboundNativeHostMessageSchema>;
