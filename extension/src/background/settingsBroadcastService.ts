import { SETTINGS_STORAGE_KEY } from "../domain/settings/settingsRepository";
import { normalizeUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { createExtensionMessage } from "../shared/messaging/extensionMessageBus";

type TabsQuery = (queryInfo: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab[]>;
type TabsSendMessage = (tabId: number, message: ReturnType<typeof createExtensionMessage>) => Promise<void>;

const createTabsQuery = (): TabsQuery => async (queryInfo) => {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return [];
  }

  return chrome.tabs.query(queryInfo);
};

const createTabsSendMessage = (): TabsSendMessage => async (tabId, message) => {
  if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
    return;
  }

  await chrome.tabs.sendMessage(tabId, message);
};

export class SettingsBroadcastService {
  public constructor(
    private readonly queryTabs: TabsQuery = createTabsQuery(),
    private readonly sendMessage: TabsSendMessage = createTabsSendMessage(),
    private readonly storageKey = SETTINGS_STORAGE_KEY
  ) {}

  public register(): void {
    if (typeof chrome === "undefined" || !chrome.storage?.onChanged) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      const change = changes[this.storageKey];
      if (!change?.newValue) {
        return;
      }

      void this.broadcast(normalizeUserSettings(change.newValue));
    });
  }

  public async broadcast(settings: UserSettings): Promise<void> {
    const tabs = await this.queryTabs({
      url: "https://web.whatsapp.com/*"
    });

    await Promise.allSettled(
      tabs.flatMap((tab) =>
        typeof tab.id === "number"
          ? [this.sendMessage(tab.id, createExtensionMessage("settings.updated", settings))]
          : []
      )
    );
  }
}

export const registerSettingsBroadcastService = (
  service: SettingsBroadcastService = new SettingsBroadcastService()
): SettingsBroadcastService => {
  service.register();
  return service;
};
