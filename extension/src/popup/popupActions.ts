import {
  buildShortcutStatusModel,
  createDefaultShortcutStatusModel,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import {
  createManualPreviewStartMessage,
  manualPreviewStartResultSchema
} from "../preview/manualPreviewMessaging";

export type ManualTranslateTriggerResult = "sent" | "unsupportedContext";

const getChromeTabsApi = (): typeof chrome.tabs | undefined =>
  typeof chrome === "undefined" ? undefined : chrome.tabs;

const isWhatsAppWebUrl = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname === "web.whatsapp.com";
  } catch {
    return false;
  }
};

export const openExtensionPage = async (path: string): Promise<void> => {
  if (typeof chrome === "undefined" || !chrome.tabs?.create || !chrome.runtime?.getURL) {
    return;
  }

  await chrome.tabs.create({
    url: chrome.runtime.getURL(path),
    active: true
  });
};

export const openOnboardingPage = async (): Promise<void> => {
  await openExtensionPage("src/onboarding/index.html");
};

export const openOptionsPage = async (section?: "privacy" | "diagnostics"): Promise<void> => {
  const hash = section ? `#${section}` : "";
  await openExtensionPage(`src/options/index.html${hash}`);
};

export const loadShortcutStatus = async (): Promise<ShortcutStatusModel> =>
  await new Promise<ShortcutStatusModel>((resolve) => {
    if (typeof chrome === "undefined" || !chrome.commands?.getAll) {
      resolve(createDefaultShortcutStatusModel());
      return;
    }

    chrome.commands.getAll((commands) => {
      resolve(buildShortcutStatusModel(commands));
    });
  });

export const triggerManualTranslationFromPopup = async (): Promise<ManualTranslateTriggerResult> => {
  const tabsApi = getChromeTabsApi();
  if (!tabsApi?.query || !tabsApi?.sendMessage) {
    return "unsupportedContext";
  }

  const tabs = await tabsApi.query({
    active: true,
    currentWindow: true
  });
  const activeTab = tabs.find((tab) => typeof tab.id === "number");
  if (!activeTab || typeof activeTab.id !== "number" || !isWhatsAppWebUrl(activeTab.url)) {
    return "unsupportedContext";
  }

  try {
    const response = await tabsApi.sendMessage(
      activeTab.id,
      createManualPreviewStartMessage("action")
    );
    const parsedResponse = manualPreviewStartResultSchema.safeParse(response);
    return parsedResponse.success && parsedResponse.data.payload.accepted
      ? "sent"
      : "unsupportedContext";
  } catch {
    return "unsupportedContext";
  }
};
