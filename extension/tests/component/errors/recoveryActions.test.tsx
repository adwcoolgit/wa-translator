// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createSanitizedError } from "../../../src/domain/errors/sanitizedErrors";
import { RecoveryActionPanel } from "../../../src/shared/components/RecoveryActionPanel";

describe("RecoveryActionPanel", () => {
  it("renders recoverable timeout copy and emits recovery actions", () => {
    const onAction = vi.fn();

    render(
      <RecoveryActionPanel
        error={createSanitizedError("PROVIDER_TIMEOUT")}
        onAction={onAction}
      />
    );

    expect(screen.getByRole("heading", { name: /translation timed out/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /translate again/i }));
    fireEvent.click(screen.getByRole("button", { name: /open diagnostics/i }));

    expect(onAction).toHaveBeenNthCalledWith(1, "retry");
    expect(onAction).toHaveBeenNthCalledWith(2, "openDiagnostics");
  });

  it("uses copy-first fallback copy when insertion is no longer safe", () => {
    render(<RecoveryActionPanel error={createSanitizedError("INSERTION_FAILED")} />);

    expect(screen.getByText(/copy the current result or retry on the latest target/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy translation/i })).toBeInTheDocument();
  });
});
