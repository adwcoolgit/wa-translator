import { z } from "zod";

import {
  diagnosticsEventSchema,
  type DiagnosticsEvent
} from "../contracts/diagnostics";
import {
  nativeLifecycleResultSchema,
  nativeTranslationRequestMessageSchema,
  nativeTranslationResponseMessageSchema,
  type NativeLifecycleResult,
  type NativeTranslationRequestMessage,
  type NativeTranslationResponseMessage
} from "../contracts/nativeMessaging";
import {
  onboardingProgressSchema,
  userSettingsSchema,
  type UserSettings
} from "../../domain/settings/userSettings";

const onboardingStatusPayloadSchema = z
  .object({
    onboardingStatus: z.enum(["notStarted", "inProgress", "complete", "blocked"]),
    onboardingProgress: onboardingProgressSchema,
    privacyConsentVersion: z.string().trim().min(1),
    providerActive: z.enum(["codex", "claude"])
  })
  .strict();

export const extensionMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("translation.request"), payload: nativeTranslationRequestMessageSchema }).strict(),
  z.object({ type: z.literal("translation.response"), payload: nativeTranslationResponseMessageSchema }).strict(),
  z.object({ type: z.literal("settings.updated"), payload: userSettingsSchema }).strict(),
  z.object({ type: z.literal("onboarding.status.updated"), payload: onboardingStatusPayloadSchema }).strict(),
  z.object({ type: z.literal("companion.lifecycle.result"), payload: nativeLifecycleResultSchema }).strict(),
  z.object({ type: z.literal("diagnostics.event"), payload: diagnosticsEventSchema }).strict()
]);

export type ExtensionMessage = z.infer<typeof extensionMessageSchema>;

export type ExtensionMessageMap = {
  "translation.request": NativeTranslationRequestMessage;
  "translation.response": NativeTranslationResponseMessage;
  "settings.updated": UserSettings;
  "onboarding.status.updated": z.infer<typeof onboardingStatusPayloadSchema>;
  "companion.lifecycle.result": NativeLifecycleResult;
  "diagnostics.event": DiagnosticsEvent;
};

export const parseExtensionMessage = (message: unknown): ExtensionMessage =>
  extensionMessageSchema.parse(message);

export const createExtensionMessage = <TType extends keyof ExtensionMessageMap>(
  type: TType,
  payload: ExtensionMessageMap[TType]
): ExtensionMessage => parseExtensionMessage({ type, payload });

export const validateExtensionMessagePayload = <TType extends keyof ExtensionMessageMap>(
  type: TType,
  payload: unknown
): ExtensionMessageMap[TType] => {
  switch (type) {
    case "translation.request":
      return nativeTranslationRequestMessageSchema.parse(payload) as ExtensionMessageMap[TType];
    case "translation.response":
      return nativeTranslationResponseMessageSchema.parse(payload) as ExtensionMessageMap[TType];
    case "settings.updated":
      return userSettingsSchema.parse(payload) as ExtensionMessageMap[TType];
    case "onboarding.status.updated":
      return onboardingStatusPayloadSchema.parse(payload) as ExtensionMessageMap[TType];
    case "companion.lifecycle.result":
      return nativeLifecycleResultSchema.parse(payload) as ExtensionMessageMap[TType];
    case "diagnostics.event":
      return diagnosticsEventSchema.parse(payload) as ExtensionMessageMap[TType];
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported extension message type: ${String(exhaustiveCheck)}`);
    }
  }
};
