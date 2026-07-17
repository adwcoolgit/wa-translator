// @vitest-environment jsdom
import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createSanitizedError } from "../../../src/domain/errors/sanitizedErrors";
import { createManualTranslationController } from "../../../src/content/manual/manualTranslationController";
import { defaultUserSettings } from "../../../src/domain/settings/userSettings";
import type { TranslationRequest, TranslationResponse } from "../../../src/shared/contracts/translation";

const completeSettings = {
  ...defaultUserSettings,
  onboardingStatus: "complete" as const,
  onboardingProgress: {
    currentStep: "ready" as const,
    consentAccepted: true
  }
};

const selectText = (node: Node, start: number, end: number): void => {
  const selection = window.getSelection();
  if (!selection) {
    throw new Error("Selection API unavailable.");
  }

  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  selection.removeAllRanges();
  selection.addRange(range);
};

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("ManualTranslationController", () => {
  it("prioritizes non-editable selected text over an existing composer draft", async () => {
    document.body.innerHTML = `
      <div data-testid="chat-thread" data-chat-scope="chat-a">
        <p id="bubble">Hello from bubble</p>
        <div data-testid="composer" contenteditable="true">Draft composer text</div>
      </div>
    `;

    const bubbleTextNode = document.getElementById("bubble")?.firstChild;
    if (!bubbleTextNode) {
      throw new Error("Bubble text node missing.");
    }

    selectText(bubbleTextNode, 0, "Hello from bubble".length);

    const controller = createManualTranslationController({
      settingsRepository: {
        load: async () => completeSettings
      } as never,
      runtimeGateway: {
        translate: async (request: TranslationRequest): Promise<TranslationResponse> => ({
          contractVersion: "1.0",
          requestId: request.requestId,
          status: "success",
          translation: "Halo dari bubble",
          detectedSourceLanguage: "en",
          provider: request.provider,
          latencyMs: 100,
          error: null
        })
      }
    });

    await act(async () => {
      await controller.start(document);
      await controller.requestManualTranslation();
    });

    await waitFor(() => {
      expect(screen.getByTestId("manual-preview-source")).toHaveTextContent("Hello from bubble");
    });
    expect(screen.getByRole("button", { name: /insert into composer/i })).toBeInTheDocument();

    await act(async () => {
      controller.stop();
    });
  });

  it("renders provider failures back into the manual preview", async () => {
    document.body.innerHTML = `
      <div data-testid="chat-thread" data-chat-scope="chat-a">
        <div data-testid="composer" contenteditable="true">Hello Andri</div>
      </div>
    `;

    const composerTextNode = document.querySelector("[data-testid='composer']")?.firstChild;
    if (!composerTextNode) {
      throw new Error("Composer text node missing.");
    }

    selectText(composerTextNode, 0, "Hello".length);

    const controller = createManualTranslationController({
      settingsRepository: {
        load: async () => completeSettings
      } as never,
      runtimeGateway: {
        translate: async (request: TranslationRequest): Promise<TranslationResponse> => ({
          contractVersion: "1.0",
          requestId: request.requestId,
          status: "error",
          translation: null,
          detectedSourceLanguage: null,
          provider: request.provider,
          latencyMs: 100,
          error: createSanitizedError("PROVIDER_TIMEOUT")
        })
      }
    });

    await act(async () => {
      await controller.start(document);
      await controller.requestManualTranslation();
    });

    await waitFor(() => {
      expect(screen.getByText(/Translation failed: PROVIDER_TIMEOUT\./i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("manual-preview-error")).toHaveTextContent("retry");

    await act(async () => {
      controller.stop();
    });
  });
});
