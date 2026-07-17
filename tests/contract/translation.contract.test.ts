import { describe, expect, it } from "vitest";

import { buildNativeTranslationRequestMessage } from "../../extension/src/background/translationRouter";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";
import {
  nativeTranslationRequestMessageSchema,
  nativeTranslationResponseMessageSchema
} from "../../extension/src/shared/contracts/nativeMessaging";
import {
  translationRequestSchema,
  translationResponseSchema
} from "../../extension/src/shared/contracts/translation";

describe("translation request and response contract", () => {
  it("builds a normalized incoming translation request for received messages", () => {
    const request = translationRequestSchema.parse({
      contractVersion: "1.0",
      requestId: "incoming-001",
      provider: "codex",
      mode: "incoming",
      targetType: "receivedMessage",
      sourceText: "Hello from WhatsApp.",
      sourceLanguage: defaultUserSettings.sourceLanguage,
      targetLanguage: defaultUserSettings.targetLanguage,
      style: {
        id: defaultUserSettings.styleId,
        customInstruction: null
      },
      preserve: ["emoji", "urls", "names", "mentions", "lineBreaks", "punctuation"],
      glossary: [],
      context: [],
      settingsSnapshot: {
        incomingMode: "inline",
        manualMode: defaultUserSettings.manualMode,
        promptContractVersion: defaultUserSettings.promptContractVersion
      },
      outputFormat: "json"
    });

    const message = buildNativeTranslationRequestMessage(request);
    const parsedMessage = nativeTranslationRequestMessageSchema.parse(message);

    expect(parsedMessage.type).toBe("translationRequest");
    expect(parsedMessage.payload.requestId).toBe("incoming-001");
    expect(parsedMessage.payload.targetType).toBe("receivedMessage");
  });

  it("accepts a successful normalized translation response and preserves the echoed request id", () => {
    const response = nativeTranslationResponseMessageSchema.parse({
      type: "translationResponse",
      protocolVersion: "1.0",
      payload: {
        contractVersion: "1.0",
        requestId: "incoming-001",
        status: "success",
        translation: "Halo dari WhatsApp.",
        detectedSourceLanguage: "en",
        provider: "codex",
        latencyMs: 1450,
        error: null
      }
    });

    expect(translationResponseSchema.parse(response.payload).requestId).toBe("incoming-001");
    expect(response.payload.translation).toBe("Halo dari WhatsApp.");
  });

  it("rejects error responses that omit sanitized error details", () => {
    expect(() =>
      translationResponseSchema.parse({
        contractVersion: "1.0",
        requestId: "incoming-002",
        status: "error",
        translation: null,
        detectedSourceLanguage: null,
        provider: "claude",
        latencyMs: 3200,
        error: null
      })
    ).toThrow();
  });
});
