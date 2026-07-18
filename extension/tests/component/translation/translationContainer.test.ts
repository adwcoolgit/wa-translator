// @vitest-environment jsdom
import { fireEvent } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTranslationContainer,
  type TranslationContainerModel
} from "../../../src/content/rendering/translationContainer";

const createModel = (
  overrides: Partial<TranslationContainerModel> = {}
): TranslationContainerModel => ({
  anchorId: "anchor-1",
  mode: "tooltip",
  requestState: "success",
  translation: "Halo dunia",
  error: null,
  translationVisible: true,
  originalVisible: true,
  actions: {
    onCopy: vi.fn(),
    onRetry: vi.fn(),
    onHide: vi.fn(),
    onToggleVisibility: vi.fn(),
    onRequestTranslation: vi.fn()
  },
  ...overrides
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createTranslationContainer", () => {
  it("restores focus to the remaining surface when a tooltip popover closes through rerender", async () => {
    document.body.innerHTML = `<article data-testid="message"></article>`;
    const messageElement = document.querySelector<HTMLElement>("[data-testid='message']");
    if (!messageElement) {
      throw new Error("Message element missing.");
    }

    const model = createModel();
    const container = createTranslationContainer(messageElement, model);
    const trigger = container.root.querySelector<HTMLButtonElement>("button");
    if (!trigger) {
      throw new Error("Tooltip trigger missing.");
    }

    fireEvent.click(trigger);

    container.update(
      createModel({
        mode: "inline"
      })
    );

    expect(document.activeElement).toBe(
      container.root.querySelector<HTMLButtonElement>("button:not([disabled])")
    );
    container.remove();
  });
});


