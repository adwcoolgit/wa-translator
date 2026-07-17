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

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    fireEvent.click(screen.getByRole("button", { name: /open diagnostics/i }));

    expect(onAction).toHaveBeenNthCalledWith(1, "retry");
    expect(onAction).toHaveBeenNthCalledWith(2, "openDiagnostics");
  });
});