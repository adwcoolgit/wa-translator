import { CompanionLifecycleService } from "./companionLifecycleService";
import { OnboardingGate, registerOnboardingGate } from "./onboardingGate";
import { onboardingRuntimeRequestSchema } from "../onboarding/runtimeMessages";
import { createSettingsRepository } from "../domain/settings/settingsRepository";

const settingsRepository = createSettingsRepository();
const onboardingGate = new OnboardingGate(settingsRepository);
const companionLifecycleService = new CompanionLifecycleService();

registerOnboardingGate(onboardingGate);

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const parsed = onboardingRuntimeRequestSchema.safeParse(message);
    if (!parsed.success) {
      return false;
    }

    void (async () => {
      switch (parsed.data.type) {
        case "onboarding.queryLifecycle":
          sendResponse({
            type: "onboarding.queryLifecycle.result",
            payload: await companionLifecycleService.queryLifecycle()
          });
          break;
        case "onboarding.runHealthCheck":
          sendResponse({
            type: "onboarding.runHealthCheck.result",
            payload: await companionLifecycleService.runSyntheticProviderHealthCheck(
              parsed.data.provider,
              parsed.data.settings
            )
          });
          break;
        default: {
          const exhaustiveCheck: never = parsed.data;
          throw new Error(`Unsupported onboarding runtime message: ${String(exhaustiveCheck)}`);
        }
      }
    })();

    return true;
  });
}
