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

describe("popup surface contract", () => {
  it("builds a healthy compact popup state for daily controls", () => {
    const popupState = buildPopupState({
      settings: {
        ...defaultUserSettings,
        onboardingStatus: "complete",
        onboardingProgress: {
          currentStep: "ready",
          consentAccepted: true
        },
        targetLanguage: "en",
        recentTargetLanguages: ["ja", "en"]
      },
      providerHealth: normalizeProviderHealthState({
        provider: "codex",
        outcome: "ready",
        latencyMs: 1200
      }),
      shortcutStatus: {
        ...createDefaultShortcutStatusModel(),
        shortcut: "Ctrl+Shift+Y",
        state: "assigned",
        summary: "Shortcut assigned",
        details: "Ctrl+Shift+Y is assigned to the manual translate command."
      }
    });

    expect(popupState.setupState).toBe("ready");
    expect(popupState.manualActionAvailable).toBe(true);
    expect(popupState.footerLinks?.map((link) => link.id)).toEqual(["settings"]);
    expect(popupState.providerSummary?.selectedProvider).toBe("codex");
    expect(popupState.providerStatus).toBe("ready");
    expect(popupState.recentTargetLanguages).toEqual(["ja", "en"]);
  });

  it("keeps compact controls visible but blocked during setup-required states", () => {
    const popupState = buildPopupState({
      settings: {
        ...defaultUserSettings,
        onboardingStatus: "inProgress"
      },
      providerHealth: createUnknownProviderHealth("codex"),
      shortcutStatus: createDefaultShortcutStatusModel()
    });

    expect(popupState.setupState).toBe("required");
    expect(popupState.manualActionAvailable).toBe(false);
    expect(popupState.footerLinks?.map((link) => link.id)).toEqual(["settings", "privacy"]);
    expect(popupState.stateBadges?.some((badge) => /setup required/i.test(badge.label))).toBe(true);
  });

  it("ignores stale provider summaries from a different selected provider during async refresh", () => {
    const popupState = buildPopupState({
      settings: {
        ...defaultUserSettings,
        onboardingStatus: "complete",
        onboardingProgress: {
          currentStep: "ready",
          consentAccepted: true
        },
        providerActive: "claude",
        targetLanguage: "ja"
      },
      providerHealth: normalizeProviderHealthState({
        provider: "codex",
        outcome: "ready",
        latencyMs: 900
      }),
      shortcutStatus: createDefaultShortcutStatusModel()
    });

    expect(popupState.providerSummary?.selectedProvider).toBe("claude");
    expect(popupState.providerStatus).toBe("unknown");
    expect(popupState.targetLanguage).toBe("ja");
  });
});
