import { describe, expect, it } from "vitest";

import { mergeUserSettings } from "../../../src/domain/settings/userSettings";
import { defaultUserSettings } from "../../../src/domain/settings/userSettings";

describe("user settings custom style retention", () => {
  it("keeps the stored custom style when the active style switches away from custom", () => {
    const nextSettings = mergeUserSettings(
      {
        ...defaultUserSettings,
        styleId: "custom",
        customStyle: {
          name: "Business",
          instruction: "Keep it concise and formal.",
          isValid: true
        }
      },
      {
        styleId: "formal"
      }
    );

    expect(nextSettings.styleId).toBe("formal");
    expect(nextSettings.customStyle).toEqual({
      name: "Business",
      instruction: "Keep it concise and formal.",
      isValid: true
    });
  });
});