import { messageFingerprintSchema } from "../../shared/contracts/domAdapter";
import {
  type TranslationRequest,
  type TranslationResponse,
  preserveRuleSchema,
  translationResponseSchema
} from "../../shared/contracts/translation";

export const DEFAULT_SESSION_CACHE_TTL_MINUTES = 15;

export type MessageFingerprint = ReturnType<typeof messageFingerprintSchema.parse>;

export type TranslationCacheEntry = {
  cacheKey: string;
  translation: string;
  detectedSourceLanguage: string | null;
  provider: "codex" | "claude";
  createdAt: number;
  expiresAt: number;
};

export type SessionCachePolicy = {
  enabled: boolean;
  ttlMinutes: number;
  maxEntries: number;
};

const simpleHash = (value: string): string => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const createSessionCachePolicy = (input?: Partial<SessionCachePolicy>): SessionCachePolicy => ({
  enabled: input?.enabled ?? true,
  ttlMinutes: input?.ttlMinutes ?? DEFAULT_SESSION_CACHE_TTL_MINUTES,
  maxEntries: input?.maxEntries ?? 200
});

export const buildMessageFingerprintId = (input: {
  chatScope: string;
  direction: "received" | "sent";
  senderScope?: string | null;
  normalizedTextSignal: string;
  structuralSignal?: string | null;
  timeSignal?: string | null;
  quotedState: "none" | "hasQuote" | "unknown";
  adapterVersion: string;
}): string => {
  const composite = [
    input.chatScope,
    input.direction,
    input.senderScope ?? "",
    input.normalizedTextSignal,
    input.structuralSignal ?? "",
    input.timeSignal ?? "",
    input.quotedState,
    input.adapterVersion
  ].join("|");

  return `fp_${simpleHash(composite)}`;
};

export const createMessageFingerprint = (input: {
  chatScope: string;
  direction: "received" | "sent";
  senderScope?: string | null;
  normalizedTextSignal: string;
  structuralSignal?: string | null;
  timeSignal?: string | null;
  quotedState: "none" | "hasQuote" | "unknown";
  adapterVersion: string;
  now?: number;
  ttlMinutes?: number;
}): MessageFingerprint => {
  const now = input.now ?? Date.now();
  const ttlMinutes = input.ttlMinutes ?? DEFAULT_SESSION_CACHE_TTL_MINUTES;

  return messageFingerprintSchema.parse({
    fingerprintId: buildMessageFingerprintId(input),
    chatScope: input.chatScope,
    direction: input.direction,
    senderScope: input.senderScope ?? null,
    normalizedTextSignal: input.normalizedTextSignal,
    structuralSignal: input.structuralSignal ?? null,
    timeSignal: input.timeSignal ?? null,
    quotedState: input.quotedState,
    adapterVersion: input.adapterVersion,
    expiresAt: now + ttlMinutes * 60_000
  });
};

export const buildTranslationCacheKey = (request: Pick<
  TranslationRequest,
  "sourceText" | "targetLanguage" | "style" | "settingsSnapshot" | "preserve"
>): string => {
  const preserve = [...request.preserve].sort((left, right) => {
    preserveRuleSchema.parse(left);
    preserveRuleSchema.parse(right);
    return left.localeCompare(right);
  });

  const composite = JSON.stringify({
    sourceText: request.sourceText,
    targetLanguage: request.targetLanguage,
    style: request.style,
    preserve,
    promptContractVersion: request.settingsSnapshot.promptContractVersion
  });

  return `cache_${simpleHash(composite)}`;
};

export const createTranslationCacheEntry = (
  request: TranslationRequest,
  response: TranslationResponse,
  now = Date.now(),
  ttlMinutes = DEFAULT_SESSION_CACHE_TTL_MINUTES
): TranslationCacheEntry => {
  const validResponse = translationResponseSchema.parse(response);

  if (validResponse.status !== "success" || validResponse.translation === null) {
    throw new Error("Only successful translation responses can be cached");
  }

  return {
    cacheKey: buildTranslationCacheKey(request),
    translation: validResponse.translation,
    detectedSourceLanguage: validResponse.detectedSourceLanguage,
    provider: validResponse.provider,
    createdAt: now,
    expiresAt: now + ttlMinutes * 60_000
  };
};

export const isTranslationCacheEntryExpired = (
  entry: TranslationCacheEntry,
  now = Date.now()
): boolean => entry.expiresAt <= now;
