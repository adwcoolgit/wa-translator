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

export type LocalDataActionId = "clearLocalData" | "resetSettings";

export interface LocalDataActionDefinition {
  actionId: LocalDataActionId;
  title: string;
  description: string;
  impactSummary: string[];
  confirmationLabel: string;
  requiresTypedConfirmation: boolean;
  successMessage: string;
  resetSettings: boolean;
}

const localDataActionCatalog: Record<LocalDataActionId, LocalDataActionDefinition> = {
  clearLocalData: {
    actionId: "clearLocalData",
    title: "Clear local operational data",
    description: "Remove only session-scoped cache and diagnostics without changing saved defaults.",
    impactSummary: [
      "Session-only translation cache is removed.",
      "Redacted diagnostics history is cleared.",
      "Saved language, provider, and style defaults stay unchanged."
    ],
    confirmationLabel: "I understand this only clears local operational data.",
    requiresTypedConfirmation: false,
    successMessage: "Session-only data and diagnostics were cleared.",
    resetSettings: false
  },
  resetSettings: {
    actionId: "resetSettings",
    title: "Reset WA Translator settings",
    description: "Return saved settings to safe defaults and clear session-scoped operational data.",
    impactSummary: [
      "Saved extension defaults return to the MVP safe baseline.",
      "Session-only cache and diagnostics are cleared.",
      "Provider health must be rechecked after reset if setup is incomplete."
    ],
    confirmationLabel: "I understand this resets saved settings and clears local operational data.",
    requiresTypedConfirmation: false,
    successMessage: "Settings were reset to safe defaults and session-only data was cleared.",
    resetSettings: true
  }
};

const createMemorySessionStorageArea = (): SessionStorageAreaLike =>
  createMemoryPersistentStorageArea();

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
  actionId: LocalDataActionId;
  statusMessage: string;
  resetSettings: boolean;
  settings: UserSettings;
}

export const getLocalDataActionDefinition = (
  actionId: LocalDataActionId
): LocalDataActionDefinition => localDataActionCatalog[actionId];

export const listLocalDataActionDefinitions = (): LocalDataActionDefinition[] =>
  Object.values(localDataActionCatalog);

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

    return this.createResult("clearLocalData", settings);
  }

  public async resetSettings(): Promise<LocalDataActionResult> {
    await this.sessionStorageArea.clear();
    this.diagnosticsCollector.clear();
    const settings = await this.settingsRepository.reset();

    return this.createResult("resetSettings", settings);
  }

  private createResult(
    actionId: LocalDataActionId,
    settings: UserSettings
  ): LocalDataActionResult {
    const definition = getLocalDataActionDefinition(actionId);

    return {
      actionId,
      statusMessage: definition.successMessage,
      resetSettings: definition.resetSettings,
      settings
    };
  }
}

export const createLocalDataActions = (
  settingsRepository?: SettingsRepository,
  diagnosticsCollector?: DiagnosticsCollector,
  sessionStorageArea?: SessionStorageAreaLike
): LocalDataActions =>
  new LocalDataActions(settingsRepository, diagnosticsCollector, sessionStorageArea);
