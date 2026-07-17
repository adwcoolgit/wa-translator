import { describe, expect, it } from "vitest";

import {
  SYNTHETIC_HEALTH_CHECK_TEXT,
  buildSyntheticHealthCheckMessage,
  mapHealthCheckResponseToProviderHealth
} from "../../extension/src/background/companionLifecycleService";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";
import {
  nativeProviderHealthCheckResultMessageSchema,
  providerHealthCheckRequestSchema
} from "../../extension/src/shared/contracts/nativeMessaging";

describe("provider synthetic health check contract", () => {
  it("builds a dedicated provider health-check request that uses synthetic text only", () => {
    const message = buildSyntheticHealthCheckMessage("codex", defaultUserSettings);
    const parsedRequest = providerHealthCheckRequestSchema.parse(message.payload);

    expect(message.type).toBe("providerHealthCheckRequest");
    expect(parsedRequest.syntheticText).toBe(SYNTHETIC_HEALTH_CHECK_TEXT);
    expect(parsedRequest.targetLanguage).toBe(defaultUserSettings.targetLanguage);
    expect(parsedRequest.timeoutSeconds).toBe(defaultUserSettings.providerTimeoutSeconds);
  });

  it("normalizes successful synthetic responses into a ready provider state", () => {
    const response = nativeProviderHealthCheckResultMessageSchema.parse({
      type: "providerHealthCheckResult",
      protocolVersion: "1.0",
      payload: {
        contractVersion: "1.0",
        requestId: "health-codex-1",
        status: "success",
        translation: "Tes sintetis berhasil.",
        detectedSourceLanguage: "id",
        provider: "codex",
        latencyMs: 1800,
        error: null
      }
    });

    const health = mapHealthCheckResponseToProviderHealth(response);

    expect(health.provider).toBe("codex");
    expect(health.state).toBe("ready");
    expect(health.lastLatencyBucket).toBe("1s-3s");
  });
});
