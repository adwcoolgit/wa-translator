// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createSanitizedError } from "../../../src/domain/errors/sanitizedErrors";
import { ManualPreviewApp, type ManualPreviewModel } from "../../../src/preview/ManualPreviewApp";

const createModel = (overrides: Partial<ManualPreviewModel> = {}): ManualPreviewModel => ({
  open: true,
  sourceText: "Hello Andri",
  translation: "Halo Andri",
  targetType: "editableSelection",
  targetLabel: "Selected composer text",
  targetDescription: "Only the highlighted composer text is eligible for replacement.",
  requestSummary: "Target language: Bahasa Indonesia.",
  targetChanged: false,
  canApply: true,
  canCopy: true,
  canCancel: true,
  canUndo: false,
  canRetry: false,
  requestState: "success",
  statusText: "Translation ready for review.",
  error: null,
  applyLabel: "Replace selection",
  retryLabel: "Retry translation",
  copyLabel: "Copy translation",
  undoLabel: "Undo",
  staleReason: null,
  draftProtectionSummary:
    "Only the selected composer text can be replaced. The rest of your draft stays unchanged.",
  ...overrides
});

describe("ManualPreviewApp", () => {
  it("renders preview structure and target-specific action copy", () => {
    render(
      <ManualPreviewApp
        model={createModel()}
        handlers={{
          onApply: vi.fn(),
          onCopy: vi.fn(),
          onCancel: vi.fn()
        }}
      />
    );

    expect(screen.getByRole("dialog", { name: /manual translation preview/i })).toBeInTheDocument();
    expect(screen.getAllByText(/selected composer text/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/target language: bahasa indonesia/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello Andri/i)).toBeInTheDocument();
    expect(screen.getByText(/Halo Andri/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replace selection/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /copy translation/i })).toBeEnabled();
  });

  it("shows a changed-target warning, safer retry copy, and undo status", () => {
    render(
      <ManualPreviewApp
        model={createModel({
          sourceText: "Original snippet",
          translation: "Hasil terjemahan",
          targetType: "nonEditableSelection",
          targetLabel: "Selected received message text",
          targetDescription: "This request targets selected received-message text and can only insert the result into the composer.",
          targetChanged: true,
          canApply: false,
          canUndo: true,
          canRetry: true,
          requestState: "stale",
          statusText: "The captured target changed after translation started. Review the result, then translate the latest target again.",
          applyLabel: "Insert into composer",
          retryLabel: "Translate current target again",
          staleReason:
            "The selected received message changed or is no longer selected. Apply is blocked to avoid inserting a translation for the wrong message.",
          draftProtectionSummary:
            "WhatsApp messages are never edited in place. This result can only be inserted into the composer as a new draft."
        })}
        handlers={{
          onUndo: vi.fn(),
          onRetry: vi.fn()
        }}
      />
    );

    expect(screen.getByTestId("target-changed-warning")).toBeInTheDocument();
    expect(screen.getByText(/safer fallback/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /translate current target again/i })).toBeEnabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Undo$/i })).toBeInTheDocument();
  });

  it("renders recoverable error guidance without exposing raw provider codes in the body", () => {
    render(
      <ManualPreviewApp
        model={createModel({
          translation: null,
          canApply: false,
          canCopy: false,
          canRetry: true,
          requestState: "error",
          statusText: "Translation paused. Translation timed out.",
          error: createSanitizedError("PROVIDER_TIMEOUT"),
          applyLabel: null
        })}
        handlers={{
          onRetry: vi.fn()
        }}
      />
    );

    expect(screen.getByTestId("manual-preview-error")).toHaveTextContent(/translation timed out/i);
    expect(screen.getByTestId("manual-preview-error")).toHaveTextContent(/translate again/i);
  });

  it("hides generic retry when the recovery path requires setup instead of resubmitting", () => {
    render(
      <ManualPreviewApp
        model={createModel({
          translation: null,
          canApply: false,
          canCopy: false,
          canRetry: false,
          requestState: "error",
          statusText: "Translation paused. Provider sign-in is required.",
          error: createSanitizedError("PROVIDER_AUTH_REQUIRED"),
          applyLabel: null,
          retryLabel: null
        })}
        handlers={{
          onRetry: vi.fn()
        }}
      />
    );

    expect(screen.getByTestId("manual-preview-error")).toHaveTextContent(/provider sign-in is required/i);
    expect(screen.queryByRole("button", { name: /retry translation/i })).not.toBeInTheDocument();
  });
});


