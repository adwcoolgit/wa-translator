import {
  createManualPreviewStartMessage,
  type ManualPreviewStartMessage
} from "../preview/manualPreviewMessaging";

export const MANUAL_TRANSLATE_COMMAND = "manual-translate-selection";

type TabsQuery = (queryInfo: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab[]>;
type TabsSendMessage = (tabId: number, message: ManualPreviewStartMessage) => Promise<unknown>;

const createTabsQuery = (): TabsQuery => async (queryInfo) => {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return [];
  }

  return chrome.tabs.query(queryInfo);
};

const createTabsSendMessage = (): TabsSendMessage => async (tabId, message) => {
  if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
    return undefined;
  }

  return chrome.tabs.sendMessage(tabId, message);
};

export class ManualCommandHandler {
  public constructor(
    private readonly queryTabs: TabsQuery = createTabsQuery(),
    private readonly sendMessageToTab: TabsSendMessage = createTabsSendMessage()
  ) {}

  public register(): void {
    if (typeof chrome === "undefined" || !chrome.commands?.onCommand) {
      return;
    }

    chrome.commands.onCommand.addListener((command) => {
      void this.handleCommand(command);
    });
  }

  public async handleCommand(command: string): Promise<void> {
    if (command !== MANUAL_TRANSLATE_COMMAND) {
      return;
    }

    const tabs = await this.queryTabs({
      active: true,
      currentWindow: true
    });
    const activeTabId = tabs.find((tab) => typeof tab.id === "number")?.id;

    if (typeof activeTabId !== "number") {
      return;
    }

    await this.sendMessageToTab(activeTabId, createManualPreviewStartMessage("command"));
  }
}

export const registerManualCommandHandler = (
  handler: ManualCommandHandler = new ManualCommandHandler()
): ManualCommandHandler => {
  handler.register();
  return handler;
};
