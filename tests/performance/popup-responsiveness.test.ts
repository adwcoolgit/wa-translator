import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import {
  createUnknownProviderHealth,
  normalizeProviderHealthState
} from "../../extension/src/domain/provider/providerHealth";
import {
  buildPopupState,
  createDefaultShortcutStatusModel
} from "../../extension/src/domain/settings/settingsViewModel";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";

const percentile = (values: number[], ratio: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
};

describe("popup responsiveness", () => {
  it("keeps popup state mapping responsive while provider health refreshes in the background", () => {
    const durations: number[] = [];
    const shortcutStatus = createDefaultShortcutStatusModel();
    const settings = {
      ...defaultUserSettings,
      onboardingStatus: "complete" as const,
      onboardingProgress: {
        currentStep: "ready" as const,
        consentAccepted: true
      },
      targetLanguage: "ja" as const,
      recentTargetLanguages: ["ja", "en"]
    };

    for (let iteration = 0; iteration < 250; iteration += 1) {
      const providerHealth =
        iteration % 2 === 0
          ? createUnknownProviderHealth("codex")
          : normalizeProviderHealthState({
              provider: "codex",
              outcome: "ready",
              latencyMs: 1400,
              lastCheckedAt: Date.now() + iteration
            });

      const startedAt = performance.now();
      const popupState = buildPopupState({
        settings,
        providerHealth,
        shortcutStatus
      });
      durations.push(performance.now() - startedAt);

      expect(popupState.targetLanguage).toBe("ja");
      expect(popupState.recentTargetLanguages).toEqual(["ja", "en"]);
    }

    expect(percentile(durations, 0.95)).toBeLessThanOrEqual(5);
  });
});
