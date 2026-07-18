import { describe, expect, it } from "vitest";

import {
  buildRecentTargetLanguageEntries,
  buildSettingsDraftState,
  createPartialSettingsPatch,
  createTargetLanguageSettingsPatch,
  getLastHealthResultLabel,
  getOptionsSectionGroupId,
  getProviderHealthValidationMessages,
  getStartupBehaviorLabel,
  sanitizeRecentTargetLanguages,
  updateRecentTargetLanguages
} from "../../../src/domain/settings/settingsViewModel";
import { defaultUserSettings } from "../../../src/domain/settings/userSettings";

describe("settings view model helpers", () => {
  it("keeps recent target languages unique and capped", () => {
    const nextRecentLanguages = updateRecentTargetLanguages(
      ["en", "ja", "en", "ko", "ar"],
      "ms"
    );

    expect(nextRecentLanguages).toEqual(["ms", "en", "ja", "ko", "ar"]);
    expect(sanitizeRecentTargetLanguages(["ja", "ja", "xx", "en"])).toEqual(["ja", "en"]);
  });

  it("creates a settings patch that remembers the latest target language", () => {
    const patch = createTargetLanguageSettingsPatch(
      {
        ...defaultUserSettings,
        recentTargetLanguages: ["en", "ja"]
      },
      "ko"
    );

    expect(patch).toEqual({
      targetLanguage: "ko",
      recentTargetLanguages: ["ko", "en", "ja"]
    });
  });

  it("extends partial settings patches when the target language changes", () => {
    expect(
      createPartialSettingsPatch(
        {
          ...defaultUserSettings,
          recentTargetLanguages: ["en", "ja"]
        },
        { targetLanguage: "ko" }
      )
    ).toEqual({
      targetLanguage: "ko",
      recentTargetLanguages: ["ko", "en", "ja"]
    });

    expect(createPartialSettingsPatch(defaultUserSettings, { enabled: false })).toEqual({
      enabled: false
    });
  });

  it("tracks changed settings fields for explicit save flows", () => {
    const draftState = buildSettingsDraftState({
      savedSettings: defaultUserSettings,
      draftSettings: {
        ...defaultUserSettings,
        targetLanguage: "en",
        startupBehavior: "startDisabled"
      },
      saveState: "dirty"
    });

    expect(draftState.hasUnsavedChanges).toBe(true);
    expect(draftState.changedFieldCount).toBe(2);
    expect(draftState.changedFields).toEqual(["targetLanguage", "startupBehavior"]);
  });

  it("maps sections and recent labels into the documented group structure", () => {
    expect(getOptionsSectionGroupId("provider")).toBe("system");
    expect(getStartupBehaviorLabel("restoreLastEnabled")).toMatch(/restore the last enabled state/i);
    expect(buildRecentTargetLanguageEntries(["ja", "en"])).toEqual([
      { code: "ja", label: "Japanese" },
      { code: "en", label: "English" }
    ]);
  });

  it("isolates provider validation messages and formats the last health result label", () => {
    expect(
      getProviderHealthValidationMessages({
        providerExecutablePathOverride: "Invalid path",
        customStyle: "Missing custom style",
        providerTimeoutSeconds: "Too small"
      })
    ).toEqual({
      providerExecutablePathOverride: "Invalid path",
      providerTimeoutSeconds: "Too small"
    });

    expect(
      getLastHealthResultLabel({
        provider: "codex",
        state: "ready",
        versionCategory: "synthetic-translation-ok",
        lastLatencyBucket: "1s-3s",
        lastCheckedAt: Date.now(),
        lastSanitizedError: null
      })
    ).toBe("Ready (1s-3s)");
  });
});

