import { describe, expect, it } from "vitest";

import { parseOptionsSectionFromHash } from "../../../src/options/optionsSectionRouting";

describe("parseOptionsSectionFromHash", () => {
  it("falls back to translation when advanced settings are disabled", () => {
    expect(parseOptionsSectionFromHash("#advanced")).toBe("translation");
  });

  it("keeps supported MVP sections routable", () => {
    expect(parseOptionsSectionFromHash("#privacy")).toBe("privacy");
  });
});