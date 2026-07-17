// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  applyComposerTargetTranslation,
  restoreComposerMutation
} from "../../../extension/src/content/manual/composerMutationService";
import {
  detectComposerInsertionTarget,
  detectEditableComposerTarget
} from "../../../extension/src/content/manual/composerTargetDetector";

const populatedFixturePath = resolve(
  process.cwd(),
  "..",
  "tests/fixtures/whatsapp/composer-populated.html"
);
const emptyFixturePath = resolve(
  process.cwd(),
  "..",
  "tests/fixtures/whatsapp/composer-empty.html"
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

describe("manual composer fixture flow", () => {
  it("replaces the selected composer range and restores it with undo", () => {
    document.body.innerHTML = readFileSync(populatedFixturePath, "utf8");
    setComposerSelection(0, 10);

    const target = detectEditableComposerTarget(document);
    expect(target?.snapshot.targetType).toBe("editableSelection");

    const mutation = applyComposerTargetTranslation(target!, "Halo Andri");
    const composer = document.querySelector<HTMLElement>("[data-testid='composer']");

    expect(mutation).not.toBeNull();
    expect(composer?.textContent).toBe("Halo Andri, please review PO-7781 before 17:00.");

    const restored = restoreComposerMutation(mutation!);
    expect(restored).toBe(true);
    expect(composer?.textContent).toBe("Halo Andri, please review PO-7781 before 17:00.");
  });

  it("inserts translation into an empty composer without activating send", () => {
    document.body.innerHTML = readFileSync(emptyFixturePath, "utf8");

    const target = detectComposerInsertionTarget(document);
    const mutation = applyComposerTargetTranslation(target!, "Halo semuanya");
    const composer = document.querySelector<HTMLElement>("[data-testid='composer']");

    expect(target?.snapshot.targetType).toBe("caretInsert");
    expect(mutation).not.toBeNull();
    expect(composer?.textContent).toBe("Halo semuanya");
  });
});
