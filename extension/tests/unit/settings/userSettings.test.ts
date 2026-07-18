import { describe, expect, it } from "vitest";

import { defaultUserSettings, mergeUserSettings } from "../../../src/domain/settings/userSettings";

describe("user settings", () => {
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

  it("includes startup behavior and recent target language defaults", () => {
    expect(defaultUserSettings.startupBehavior).toBe("restoreLastEnabled");
    expect(defaultUserSettings.recentTargetLanguages).toEqual([]);
  });
});
