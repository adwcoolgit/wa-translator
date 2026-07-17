// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ManualPreviewApp } from "../../../src/preview/ManualPreviewApp";

describe("ManualPreviewApp", () => {
  it("renders preview actions for editable composer translations", () => {
    render(
      <ManualPreviewApp
        model={{
          open: true,
          sourceText: "Hello Andri",
          translation: "Halo Andri",
          targetType: "editableSelection",
          targetChanged: false,
          canApply: true,
          canCopy: true,
          canCancel: true,
          canUndo: false,
          requestState: "success",
          error: null,
          applyLabel: "Replace selection",
          undoLabel: "Undo"
        }}
        handlers={{
          onApply: vi.fn(),
          onCopy: vi.fn(),
          onCancel: vi.fn()
        }}
      />
    );

    expect(screen.getByRole("dialog", { name: /manual translation preview/i })).toBeInTheDocument();
    expect(screen.getByText(/Hello Andri/i)).toBeInTheDocument();
    expect(screen.getByText(/Halo Andri/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replace selection/i })).toBeEnabled();
  });

  it("shows a changed-target warning and undo action when required", () => {
    render(
      <ManualPreviewApp
        model={{
          open: true,
          sourceText: "Original snippet",
          translation: "Hasil terjemahan",
          targetType: "nonEditableSelection",
          targetChanged: true,
          canApply: false,
          canCopy: true,
          canCancel: true,
          canUndo: true,
          requestState: "success",
          error: null,
          applyLabel: "Insert into composer",
          undoLabel: "Undo"
        }}
        handlers={{
          onUndo: vi.fn()
        }}
      />
    );

    expect(screen.getByTestId("target-changed-warning")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Undo$/i })).toBeInTheDocument();
  });
});
