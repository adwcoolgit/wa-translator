import { getRuntimeDiagnosticsCollector } from "../../diagnostics/runtimeCollector";
import { type DiagnosticsCollector } from "../../diagnostics/diagnosticsCollector";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository,
  type SettingsRepository
} from "./settingsRepository";
import type { UserSettings } from "./userSettings";

export interface SessionStorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const createMemorySessionStorageArea = (): SessionStorageAreaLike => createMemoryPersistentStorageArea();

export const createChromeSessionStorageArea = (): SessionStorageAreaLike => {
  if (typeof chrome === "undefined" || !chrome.storage?.session) {
    return createMemorySessionStorageArea();
  }

  return {
    async get(key) {
      return chrome.storage.session.get(key);
    },
    async set(items) {
      await chrome.storage.session.set(items);
    },
    async remove(key) {
      await chrome.storage.session.remove(key);
    },
    async clear() {
      await chrome.storage.session.clear();
    }
  };
};

export interface LocalDataActionResult {
  statusMessage: string;
  resetSettings: boolean;
  settings: UserSettings;
}

export class LocalDataActions {
  public constructor(
    private readonly settingsRepository: SettingsRepository = createSettingsRepository(),
    private readonly diagnosticsCollector: DiagnosticsCollector = getRuntimeDiagnosticsCollector(),
    private readonly sessionStorageArea: SessionStorageAreaLike = createChromeSessionStorageArea()
  ) {}

  public async clearLocalData(): Promise<LocalDataActionResult> {
    const settings = await this.settingsRepository.load();
    await this.sessionStorageArea.clear();
    this.diagnosticsCollector.clear();

    return {
      statusMessage: "Session-only data and diagnostics were cleared.",
      resetSettings: false,
      settings
    };
  }

  public async resetSettings(): Promise<LocalDataActionResult> {
    await this.sessionStorageArea.clear();
    this.diagnosticsCollector.clear();
    const settings = await this.settingsRepository.reset();

    return {
      statusMessage: "Settings were reset to safe defaults and session-only data was cleared.",
      resetSettings: true,
      settings
    };
  }
}

export const createLocalDataActions = (
  settingsRepository?: SettingsRepository,
  diagnosticsCollector?: DiagnosticsCollector,
  sessionStorageArea?: SessionStorageAreaLike
): LocalDataActions => new LocalDataActions(settingsRepository, diagnosticsCollector, sessionStorageArea);

