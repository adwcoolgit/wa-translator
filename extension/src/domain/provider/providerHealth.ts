import { z } from "zod";

import { sanitizedErrorSchema } from "../../shared/contracts/diagnostics";
import { providerSchema } from "../../shared/contracts/translation";
import { providerStatusSchema } from "../../shared/contracts/uiState";

export const providerHealthSchema = z
  .object({
    provider: providerSchema,
    state: providerStatusSchema,
    versionCategory: z.string().trim().min(1).nullable(),
    lastLatencyBucket: z.string().trim().min(1).nullable(),
    lastCheckedAt: z.number().int().positive().nullable(),
    lastSanitizedError: sanitizedErrorSchema.nullable()
  })
  .strict();

export type ProviderHealthState = z.infer<typeof providerStatusSchema>;
export type ProviderHealth = z.infer<typeof providerHealthSchema>;

export const createUnknownProviderHealth = (
  provider: "codex" | "claude"
): ProviderHealth =>
  providerHealthSchema.parse({
    provider,
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
}): ProviderHealth =>
  providerHealthSchema.parse({
    provider: input.provider,
    state: input.outcome,
    versionCategory: input.versionCategory ?? null,
    lastLatencyBucket:
      typeof input.latencyMs === "number" ? bucketLatency(input.latencyMs) : null,
    lastCheckedAt: input.lastCheckedAt ?? Date.now(),
    lastSanitizedError: input.error ? sanitizedErrorSchema.parse(input.error) : null
  });
