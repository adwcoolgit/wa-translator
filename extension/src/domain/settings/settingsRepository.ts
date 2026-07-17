import {
  createDefaultUserSettings,
  mergeUserSettings,
  normalizeUserSettings,
  type PartialUserSettings,
  type UserSettings
} from "./userSettings";
import { createPersistentStorageSetPayload } from "../../shared/storage/persistentStorageGuard";

export const SETTINGS_STORAGE_KEY = "waTranslator.settings";

export interface PersistentStorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export const createMemoryPersistentStorageArea = (): PersistentStorageAreaLike => {
  const store = new Map<string, unknown>();

  return {
    async get(key) {
      return store.has(key) ? { [key]: store.get(key) } : {};
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) {
        store.set(key, value);
      }
    },
    async remove(key) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    }
  };
};

const createChromePersistentStorageArea = (): PersistentStorageAreaLike | null => {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return null;
  }

  return {
    async get(key) {
      return chrome.storage.local.get(key);
    },
    async set(items) {
      await chrome.storage.local.set(items);
    },
    async remove(key) {
      await chrome.storage.local.remove(key);
    },
    async clear() {
      await chrome.storage.local.clear();
    }
  };
};

export class SettingsRepository {
  public constructor(
    private readonly storageArea: PersistentStorageAreaLike = createChromePersistentStorageArea() ??
      createMemoryPersistentStorageArea(),
    private readonly storageKey = SETTINGS_STORAGE_KEY
  ) {}

  public async load(): Promise<UserSettings> {
    const result = await this.storageArea.get(this.storageKey);
    return normalizeUserSettings(result[this.storageKey]);
  }

  public async initialize(): Promise<UserSettings> {
    const current = await this.load();

    await this.storageArea.set(
      createPersistentStorageSetPayload({
        [this.storageKey]: current
      })
    );

    return current;
  }

  public async save(update: PartialUserSettings): Promise<UserSettings> {
    const current = await this.load();
    const next = mergeUserSettings(current, update);

    await this.storageArea.set(
      createPersistentStorageSetPayload({
        [this.storageKey]: next
      })
    );

    return next;
  }

  public async reset(): Promise<UserSettings> {
    const next = createDefaultUserSettings();

    await this.storageArea.set(
      createPersistentStorageSetPayload({
        [this.storageKey]: next
      })
    );

    return next;
  }

  public async clear(): Promise<void> {
    await this.storageArea.remove(this.storageKey);
  }
}

export const createSettingsRepository = (
  storageArea?: PersistentStorageAreaLike,
  storageKey?: string
): SettingsRepository => new SettingsRepository(storageArea, storageKey);
