import { describe, expect, it } from "vitest";

import { createSanitizedError, sanitizedErrorCatalog } from "../../../src/domain/errors/sanitizedErrors";
import { presentRecoverableError } from "../../../src/shared/errors/recoverableErrorPresenter";

describe("sanitizedErrors catalog", () => {
  it("creates a sanitized error for every catalog entry", () => {
    for (const code of Object.keys(sanitizedErrorCatalog)) {
      const error = createSanitizedError(code as keyof typeof sanitizedErrorCatalog);
      expect(error.code).toBe(code);
      expect(error.supportCode).toBe(code);
      expect(error.recoveryAction).toBe(sanitizedErrorCatalog[code as keyof typeof sanitizedErrorCatalog].recoveryAction);
    }
  });

  it("presents host-not-found errors with install guidance", () => {
    const presentation = presentRecoverableError(createSanitizedError("HOST_NOT_FOUND"));

    expect(presentation.title).toMatch(/local companion is missing/i);
    expect(presentation.body).toMatch(/install the windows companion/i);
    expect(presentation.primaryAction.action).toBe("installCompanion");
    expect(presentation.secondaryAction?.action).toBe("openDiagnostics");
  });
});