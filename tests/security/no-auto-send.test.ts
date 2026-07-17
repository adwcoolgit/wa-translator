// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { applyComposerTargetTranslation } from "../../extension/src/content/manual/composerMutationService";
import { detectEditableComposerTarget } from "../../extension/src/content/manual/composerTargetDetector";

const populatedFixturePath = resolve(
  process.cwd(),
  "..",
  "tests/fixtures/whatsapp/composer-populated.html"
);

const setComposerSelection = (start: number, end: number): void => {
  const composer = document.querySelector<HTMLElement>("[data-testid='composer']");
  if (!composer || !composer.firstChild) {
    throw new Error("Composer fixture is not available.");
  }

  const selection = window.getSelection();
  if (!selection) {
    throw new Error("Selection API unavailable.");
  }

  const range = document.createRange();
  range.setStart(composer.firstChild, start);
  range.setEnd(composer.firstChild, end);
  selection.removeAllRanges();
  selection.addRange(range);
};

describe("manual composer security", () => {
  it("mutates composer text without triggering keyboard or submit semantics", () => {
    document.body.innerHTML = readFileSync(populatedFixturePath, "utf8");
    setComposerSelection(0, 10);

    const composer = document.querySelector<HTMLElement>("[data-testid='composer']");
    const submitSpy = vi.fn();
    const keydownSpy = vi.fn();
    const inputSpy = vi.fn();

    composer?.addEventListener("submit", submitSpy);
    composer?.addEventListener("keydown", keydownSpy);
    composer?.addEventListener("input", inputSpy);

    const target = detectEditableComposerTarget(document);
    const mutation = applyComposerTargetTranslation(target!, "Halo Andri");

    expect(mutation).not.toBeNull();
    expect(inputSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(keydownSpy).not.toHaveBeenCalled();
  });
});
