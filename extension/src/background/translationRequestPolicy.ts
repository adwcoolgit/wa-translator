import { createSanitizedError } from "../domain/errors/sanitizedErrors";
import type { UserSettings } from "../domain/settings/userSettings";
import { needsOnboarding } from "./onboardingGate";
import {
  sanitizedTranslationErrorSchema,
  translationResponseSchema,
  type TranslationRequest,
  type TranslationResponse
} from "../shared/contracts/translation";

export type TranslationRequestBlockReason = "disabled" | "onboardingRequired";

export const getTranslationRequestBlockReason = (
  settings: Pick<UserSettings, "enabled" | "onboardingStatus" | "onboardingProgress">
): TranslationRequestBlockReason | null => {
  if (!settings.enabled) {
    return "disabled";
  }

  if (needsOnboarding(settings) || !settings.onboardingProgress.consentAccepted) {
    return "onboardingRequired";
  }

  return null;
};

export const createBlockedTranslationResponse = (
  request: Pick<TranslationRequest, "requestId" | "provider">,
  reason: TranslationRequestBlockReason
): TranslationResponse => {
  const errorCode = reason === "disabled" ? "CANCELLED" : "ONBOARDING_REQUIRED";

  return translationResponseSchema.parse({
    contractVersion: "1.0",
    requestId: request.requestId,
    status: "error",
    translation: null,
    detectedSourceLanguage: null,
    provider: request.provider,
    latencyMs: 0,
    error: sanitizedTranslationErrorSchema.parse(createSanitizedError(errorCode))
  });
};
