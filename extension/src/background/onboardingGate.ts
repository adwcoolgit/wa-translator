import { DEFAULT_PRIVACY_CONSENT_VERSION, type UserSettings } from "../domain/settings/userSettings";
import { createSettingsRepository, type SettingsRepository } from "../domain/settings/settingsRepository";

const ONBOARDING_PAGE_PATH = "src/onboarding/index.html";

export const needsOnboarding = (settings: Pick<UserSettings, "onboardingStatus">): boolean =>
  settings.onboardingStatus !== "complete";

export const getOnboardingPageUrl = (runtimeApi: typeof chrome.runtime = chrome.runtime): string =>
  runtimeApi.getURL(ONBOARDING_PAGE_PATH);

export class OnboardingGate {
  public constructor(
    private readonly settingsRepository: SettingsRepository = createSettingsRepository(),
    private readonly tabsApi: typeof chrome.tabs | null = chrome.tabs ?? null,
    private readonly runtimeApi: typeof chrome.runtime | null = chrome.runtime ?? null
  ) {}

  public async ensureOnboardingTab(): Promise<void> {
    if (!this.tabsApi || !this.runtimeApi) {
      return;
    }

    const settings = await this.settingsRepository.initialize();
    if (!needsOnboarding(settings)) {
      return;
    }

    const onboardingUrl = getOnboardingPageUrl(this.runtimeApi);
    const existingTabs = await this.tabsApi.query({ url: onboardingUrl });

    if (existingTabs.length > 0) {
      const existingTab = existingTabs[0];

      if (typeof existingTab.id === "number") {
        await this.tabsApi.update(existingTab.id, { active: true });
      }

      if (typeof existingTab.windowId === "number" && chrome.windows?.update) {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }

      return;
    }

    await this.tabsApi.create({ url: onboardingUrl, active: true });
  }

  public async markCompleted(): Promise<UserSettings> {
    return this.settingsRepository.save({
      onboardingStatus: "complete",
      privacyConsentVersion: DEFAULT_PRIVACY_CONSENT_VERSION
    });
  }
}

export const registerOnboardingGate = (gate: OnboardingGate = new OnboardingGate()): void => {
  if (typeof chrome === "undefined" || !chrome.runtime?.onInstalled || !chrome.runtime?.onStartup) {
    return;
  }

  chrome.runtime.onInstalled.addListener(() => {
    void gate.ensureOnboardingTab();
  });

  chrome.runtime.onStartup.addListener(() => {
    void gate.ensureOnboardingTab();
  });
};
