import { describe, expect, it } from "vitest";

import { createDiagnosticsExportService } from "../../extension/src/diagnostics/diagnosticsExportService";
import { createSanitizedError } from "../../extension/src/domain/errors/sanitizedErrors";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";

describe("diagnostics export redaction", () => {
  it("strips prohibited properties and keeps only safe settings summary values", () => {
    const collector = {
      list: () => [
        {
          eventId: "evt-1",
          eventType: "translation_failed",
          timestamp: Date.now(),
          properties: {
            provider: "codex",
            rawStderr: "token leaked",
            sourceText: "hello world",
            latencyBucket: "1s-3s"
          },
          redactionStatus: "clean",
          error: createSanitizedError("PROVIDER_INVALID_OUTPUT")
        }
      ]
    };

    const service = createDiagnosticsExportService(collector as never, () => ({
      extensionVersion: "0.0.0-test",
      manifestVersion: "3",
      chromeVersion: "Chrome/Test",
      osFamily: "Windows",
      nativeHostVersion: null,
      protocolVersion: "1.0"
    }));

    const payload = service.build({
      ...defaultUserSettings,
      customStyle: {
        name: "Custom",
        instruction: "secret prompt",
        isValid: true
      },
      styleId: "custom"
    });

    expect(payload.settingsSummary.customStyleConfigured).toBe(true);
    expect(JSON.stringify(payload.settingsSummary)).not.toContain("secret prompt");
    expect(payload.events[0]?.properties.provider).toBe("codex");
    expect(payload.events[0]?.properties.latencyBucket).toBe("1s-3s");
    expect(payload.events[0]?.properties.rawStderr).toBeUndefined();
    expect(payload.events[0]?.properties.sourceText).toBeUndefined();
  });
});