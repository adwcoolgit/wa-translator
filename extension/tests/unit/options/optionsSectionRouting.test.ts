import { describe, expect, it } from "vitest";

import { parseOptionsSectionFromHash } from "../../../src/options/optionsSectionRouting";

describe("parseOptionsSectionFromHash", () => {
  it("falls back to general when advanced settings are disabled", () => {
    expect(parseOptionsSectionFromHash("#advanced")).toBe("general");
  });

  it("keeps supported MVP sections routable", () => {
    expect(parseOptionsSectionFromHash("#privacy")).toBe("privacy");
  });

  it("defaults to general for unknown or empty hashes", () => {
    expect(parseOptionsSectionFromHash("#unknown")).toBe("general");
    expect(parseOptionsSectionFromHash("")).toBe("general");
  });
});
