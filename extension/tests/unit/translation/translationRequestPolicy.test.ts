import { describe, expect, it } from "vitest";

import { createBlockedTranslationResponse, getTranslationRequestBlockReason } from "../../../src/background/translationRequestPolicy";
import { createDefaultUserSettings } from "../../../src/domain/settings/userSettings";

describe("translationRequestPolicy", () => {
  it("blocks translation when onboarding or consent is incomplete", () => {
    const settings = createDefaultUserSettings();
    settings.onboardingStatus = "inProgress";
    settings.onboardingProgress.consentAccepted = false;

    expect(getTranslationRequestBlockReason(settings)).toBe("onboardingRequired");
  });

  it("blocks translation when the extension is disabled", () => {
    const settings = createDefaultUserSettings();
    settings.onboardingStatus = "complete";
    settings.onboardingProgress.consentAccepted = true;
    settings.enabled = false;

    expect(getTranslationRequestBlockReason(settings)).toBe("disabled");
  });

  it("returns an onboarding-required sanitized response when blocked by setup", () => {
    const response = createBlockedTranslationResponse(
      {
        requestId: "incoming-001",
        provider: "codex"
      },
      "onboardingRequired"
    );

    expect(response.status).toBe("error");
    expect(response.error?.code).toBe("ONBOARDING_REQUIRED");
  });
});
