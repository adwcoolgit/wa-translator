import {
  type TranslationCacheEntry,
  buildTranslationCacheKey,
  isTranslationCacheEntryExpired
} from "../../domain/translation/sessionCache";
import type { TranslationRequest } from "../contracts/translation";

export interface SessionStorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const createMemoryStorageArea = (): SessionStorageAreaLike => {
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

const createChromeSessionStorageArea = (): SessionStorageAreaLike | null => {
  if (typeof chrome === "undefined" || !chrome.storage?.session) {
    return null;
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

export class SessionTranslationCache {
  private readonly storageArea: SessionStorageAreaLike;

  public constructor(storageArea: SessionStorageAreaLike = createChromeSessionStorageArea() ?? createMemoryStorageArea()) {
    this.storageArea = storageArea;
  }

  public async get(request: Pick<TranslationRequest, "sourceText" | "targetLanguage" | "style" | "settingsSnapshot" | "preserve">): Promise<TranslationCacheEntry | null> {
    const cacheKey = buildTranslationCacheKey(request);
    const result = await this.storageArea.get(cacheKey);
    const entry = result[cacheKey] as TranslationCacheEntry | undefined;

    if (!entry) {
      return null;
    }

    if (isTranslationCacheEntryExpired(entry)) {
      await this.storageArea.remove(cacheKey);
      return null;
    }

    return entry;
  }

  public async set(entry: TranslationCacheEntry): Promise<void> {
    await this.storageArea.set({ [entry.cacheKey]: entry });
  }

  public async delete(cacheKey: string): Promise<void> {
    await this.storageArea.remove(cacheKey);
  }

  public async clear(): Promise<void> {
    await this.storageArea.clear();
  }
}
