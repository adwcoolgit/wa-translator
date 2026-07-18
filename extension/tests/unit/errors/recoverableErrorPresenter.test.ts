import { describe, expect, it } from "vitest";

import { createSanitizedError } from "../../../src/domain/errors/sanitizedErrors";
import {
  presentRecoverableError,
  presentValidationMessage
} from "../../../src/shared/errors/recoverableErrorPresenter";

describe("recoverable error presenter", () => {
  it("presents host-not-found errors with install guidance", () => {
    const presentation = presentRecoverableError(createSanitizedError("HOST_NOT_FOUND"));

    expect(presentation.title).toMatch(/local companion is missing/i);
    expect(presentation.body).toMatch(/install the windows companion/i);
    expect(presentation.primaryAction.action).toBe("installCompanion");
    expect(presentation.secondaryAction?.action).toBe("openDiagnostics");
  });

  it("presents validation copy for destructive confirmations", () => {
    const presentation = presentValidationMessage("confirmResetSettings");

    expect(presentation.severityLabel).toBe("Needs attention");
    expect(presentation.title).toMatch(/resetting settings/i);
    expect(presentation.suggestedActionLabel).toBe("Review impact");
  });
});
