import { sanitizedErrorSchema } from "../../shared/contracts/diagnostics";
import { providerSchema } from "../../shared/contracts/translation";

export type ProviderHealthState =
  | "unknown"
  | "checking"
  | "ready"
  | "missing"
  | "authRequired"
  | "timeout"
  | "rateLimited"
  | "invalidOutput"
  | "unsafeConfiguration"
  | "versionMismatch"
  | "unavailable";

export type ProviderHealth = {
  provider: "codex" | "claude";
  state: ProviderHealthState;
  versionCategory: string | null;
  lastLatencyBucket: string | null;
  lastCheckedAt: number | null;
  lastSanitizedError: ReturnType<typeof sanitizedErrorSchema.parse> | null;
};

export const createUnknownProviderHealth = (
  provider: "codex" | "claude"
): ProviderHealth => ({
  provider: providerSchema.parse(provider),
  state: "unknown",
  versionCategory: null,
  lastLatencyBucket: null,
  lastCheckedAt: null,
  lastSanitizedError: null
});

export const bucketLatency = (latencyMs: number): string => {
  if (latencyMs < 1_000) {
    return "lt-1s";
  }

  if (latencyMs < 3_000) {
    return "1s-3s";
  }

  if (latencyMs < 6_000) {
    return "3s-6s";
  }

  if (latencyMs < 20_000) {
    return "6s-20s";
  }

  return "gte-20s";
};

export const normalizeProviderHealthState = (input: {
  provider: "codex" | "claude";
  outcome:
    | "ready"
    | "missing"
    | "authRequired"
    | "timeout"
    | "rateLimited"
    | "invalidOutput"
    | "unsafeConfiguration"
    | "versionMismatch"
    | "unavailable";
  versionCategory?: string | null;
  latencyMs?: number | null;
  lastCheckedAt?: number | null;
  error?: unknown;
}): ProviderHealth => ({
  provider: providerSchema.parse(input.provider),
  state: input.outcome,
  versionCategory: input.versionCategory ?? null,
  lastLatencyBucket:
    typeof input.latencyMs === "number" ? bucketLatency(input.latencyMs) : null,
  lastCheckedAt: input.lastCheckedAt ?? Date.now(),
  lastSanitizedError: input.error ? sanitizedErrorSchema.parse(input.error) : null
});
