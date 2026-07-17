import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { createTranslationQueue } from "../../extension/src/domain/translation/translationQueue";
import {
  translationRequestSchema,
  translationResponseSchema,
  type TranslationRequest,
  type TranslationResponse
} from "../../extension/src/shared/contracts/translation";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const buildRequest = (requestId: string): TranslationRequest =>
  translationRequestSchema.parse({
    contractVersion: "1.0",
    requestId,
    provider: "codex",
    mode: "incoming",
    targetType: "receivedMessage",
    sourceText: "Halo, ini pesan sintetis untuk benchmark healthy path.",
    sourceLanguage: "id",
    targetLanguage: "en",
    style: {
      id: "neutral",
      customInstruction: null
    },
    preserve: ["emoji", "urls", "lineBreaks", "punctuation"],
    glossary: [],
    context: [],
    settingsSnapshot: {
      incomingMode: "inline",
      manualMode: "preview",
      promptContractVersion: "1.0"
    },
    outputFormat: "json"
  });

const buildResponse = (request: TranslationRequest, latencyMs: number): TranslationResponse =>
  translationResponseSchema.parse({
    contractVersion: "1.0",
    requestId: request.requestId,
    status: "success",
    translation: "Hello, this is a synthetic healthy-path benchmark message.",
    detectedSourceLanguage: "id",
    provider: request.provider,
    latencyMs,
    error: null
  });

const percentile = (values: number[], ratio: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
};

describe("healthy translation latency benchmark", () => {
  it("keeps mocked healthy translation orchestration within MVP release thresholds", async () => {
    const queue = createTranslationQueue<TranslationResponse>(2, 50);
    const durations: number[] = [];

    const requests = Array.from({ length: 20 }, (_, iteration) => {
      const request = buildRequest(`perf-${iteration}`);
      const simulatedProviderLatency = 15 + (iteration % 5) * 5;
      const startedAt = performance.now();

      return queue.enqueue({
        requestId: request.requestId,
        priority: "visibleIncoming",
        automatic: false,
        run: async () => {
          await sleep(simulatedProviderLatency);
          return buildResponse(request, simulatedProviderLatency);
        }
      }).then((response) => {
        translationResponseSchema.parse(response);
        durations.push(Math.max(performance.now() - startedAt, response.latencyMs));
      });
    });

    await Promise.all(requests);

    const median = percentile(durations, 0.5);
    const p95 = percentile(durations, 0.95);

    expect(median).toBeLessThanOrEqual(6_000);
    expect(p95).toBeLessThanOrEqual(20_000);
  });
});
