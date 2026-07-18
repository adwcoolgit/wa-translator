// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createSanitizedError } from "../../extension/src/domain/errors/sanitizedErrors";
import { insertNonEditableTranslationIntoComposer } from "../../extension/src/content/manual/nonEditableResultActions";
import { ManualPreviewApp } from "../../extension/src/preview/ManualPreviewApp";

describe("manual preview safety", () => {
  it("keeps apply disabled and shows safer fallback copy for stale targets", () => {
    render(
      React.createElement(ManualPreviewApp, {
        model: {
          open: true,
          sourceText: "Hello bubble",
          translation: "Halo bubble",
          targetType: "nonEditableSelection",
          targetLabel: "Selected received message text",
          targetDescription: "This request targets selected received-message text and can only insert the result into the composer.",
          requestSummary: "Target language: Bahasa Indonesia.",
          targetChanged: true,
          canApply: false,
          canCopy: true,
          canCancel: true,
          canUndo: false,
          canRetry: true,
          requestState: "stale",
          statusText: "The captured target changed after translation started. Review the result, then translate the latest target again.",
          error: null,
          applyLabel: "Insert into composer",
          retryLabel: "Translate current target again",
          copyLabel: "Copy translation",
          undoLabel: "Undo",
          staleReason:
            "The selected received message changed or is no longer selected. Apply is blocked to avoid inserting a translation for the wrong message.",
          draftProtectionSummary:
            "WhatsApp messages are never edited in place. This result can only be inserted into the composer as a new draft."
        },
        handlers: {}
      })
    );

    expect(screen.getByRole("button", { name: /insert into composer/i })).toBeDisabled();
    expect(screen.getByText(/safer fallback/i)).toBeInTheDocument();
  });

  it("blocks non-editable insertion when the composer has no reliable caret", () => {
    document.body.innerHTML = `
      <div data-testid="chat-thread" data-chat-scope="chat-a">
        <p id="bubble">Hello from bubble</p>
        <div data-testid="composer" contenteditable="true">Draft composer text</div>
      </div>
    `;

    const mutation = insertNonEditableTranslationIntoComposer({
      translation: "Halo dari bubble",
      sourceChatScope: "chat-a",
      rootDocument: document
    });

    expect(mutation).toBeNull();
    expect(document.querySelector("[data-testid='composer']")?.textContent).toBe("Draft composer text");
    expect(document.getElementById("bubble")?.textContent).toBe("Hello from bubble");
  });

  it("inserts a non-editable translation only when the composer exposes a reliable caret", () => {
    document.body.innerHTML = `
      <div data-testid="chat-thread" data-chat-scope="chat-a">
        <p id="bubble">Hello from bubble</p>
        <div data-testid="composer" contenteditable="true">Draft composer text</div>
      </div>
    `;

    const composerTextNode = document.querySelector("[data-testid='composer']")?.firstChild;
    if (!composerTextNode) {
      throw new Error("Composer text node missing.");
    }

    const selection = window.getSelection();
    if (!selection) {
      throw new Error("Selection API unavailable.");
    }

    const range = document.createRange();
    range.setStart(composerTextNode, "Draft composer text".length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    const mutation = insertNonEditableTranslationIntoComposer({
      translation: "Halo dari bubble",
      sourceChatScope: "chat-a",
      rootDocument: document
    });

    expect(mutation).not.toBeNull();
    expect(document.querySelector("[data-testid='composer']")?.textContent).toBe(
      "Draft composer textHalo dari bubble"
    );
    expect(document.getElementById("bubble")?.textContent).toBe("Hello from bubble");
  });

  it("keeps recoverable error copy aligned to safe fallback actions", () => {
    render(
      React.createElement(ManualPreviewApp, {
        model: {
          open: true,
          sourceText: "Hello",
          translation: null,
          targetType: "editableSelection",
          targetLabel: "Selected composer text",
          targetDescription: "Only the highlighted composer text is eligible for replacement.",
          requestSummary: "Target language: Bahasa Indonesia.",
          targetChanged: false,
          canApply: false,
          canCopy: false,
          canCancel: true,
          canUndo: false,
          canRetry: true,
          requestState: "error",
          statusText: "Translation paused. WA Translator could not insert the result.",
          error: createSanitizedError("INSERTION_FAILED"),
          applyLabel: null,
          retryLabel: "Retry translation",
          copyLabel: "Copy translation",
          undoLabel: "Undo",
          staleReason: null,
          draftProtectionSummary:
            "Only the selected composer text can be replaced. The rest of your draft stays unchanged."
        },
        handlers: {}
      })
    );

    expect(screen.getByTestId("manual-preview-error")).toHaveTextContent(/copy the current result or retry on the latest target/i);
  });
});


