import { CompanionLifecycleService } from "./companionLifecycleService";
import { registerManualCommandHandler } from "./manualCommandHandler";
import { registerSettingsBroadcastService } from "./settingsBroadcastService";
import { TranslationRouter } from "./translationRouter";
import { createBlockedTranslationResponse, getTranslationRequestBlockReason } from "./translationRequestPolicy";
import { OnboardingGate, registerOnboardingGate } from "./onboardingGate";
import { onboardingRuntimeRequestSchema } from "../onboarding/runtimeMessages";
import { createSettingsRepository } from "../domain/settings/settingsRepository";
import { extensionMessageSchema } from "../shared/messaging/extensionMessageBus";

const settingsRepository = createSettingsRepository();
const onboardingGate = new OnboardingGate(settingsRepository);
const companionLifecycleService = new CompanionLifecycleService();
const translationRouter = new TranslationRouter();

registerOnboardingGate(onboardingGate);
registerManualCommandHandler();
registerSettingsBroadcastService();

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const extensionMessage = extensionMessageSchema.safeParse(message);
    if (extensionMessage.success && extensionMessage.data.type === "translation.request") {
      const translationRequestMessage = extensionMessage.data.payload as Parameters<TranslationRouter["translate"]>[0];

      void (async () => {
        const settings = await settingsRepository.load();
        const blockReason = getTranslationRequestBlockReason(settings);
        if (blockReason !== null) {
          if (blockReason === "onboardingRequired") {
            await onboardingGate.ensureOnboardingTab();
          }

          sendResponse({
            type: "translation.response",
            payload: {
              type: "translationResponse",
              protocolVersion: "1.0",
              payload: createBlockedTranslationResponse(translationRequestMessage.payload, blockReason)
            }
          });
          return;
        }

        sendResponse({
          type: "translation.response",
          payload: {
            type: "translationResponse",
            protocolVersion: "1.0",
            payload: await translationRouter.translate(translationRequestMessage)
          }
        });
      })();

      return true;
    }

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
