import { describe, expect, it } from "vitest";

import { createUnknownProviderHealth } from "../../extension/src/domain/provider/providerHealth";
import {
  buildOptionsState,
  createDefaultShortcutStatusModel
} from "../../extension/src/domain/settings/settingsViewModel";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository
} from "../../extension/src/domain/settings/settingsRepository";
import { createOnboardingController } from "../../extension/src/onboarding/onboardingController";
import { createSetupDiagnosticsRecorder } from "../../extension/src/diagnostics/setupDiagnostics";

describe("onboarding and options surface contracts", () => {
  it("keeps grouped settings state aligned with Basic/System/Support navigation", () => {
    const optionsState = buildOptionsState({
      activeSection: "general",
      saveState: "dirty",
      validationMessages: {},
      telemetryEnabled: false,
      shortcutStatus: createDefaultShortcutStatusModel(),
      savedSettings: defaultUserSettings,
      draftSettings: {
        ...defaultUserSettings,
        targetLanguage: "ja",
        recentTargetLanguages: ["ja"]
      },
      destructiveActionPending: "clearLocalData"
    });

    expect(optionsState.activeGroup).toBe("basic");
    expect(optionsState.hasUnsavedChanges).toBe(true);
    expect(optionsState.recentTargetLanguages).toEqual(["ja"]);
    expect(optionsState.destructiveActionPending).toBe("clearLocalData");
  });

  it("blocks onboarding from leaving privacy before consent is accepted", async () => {
    const storage = createMemoryPersistentStorageArea();
    const settingsRepository = createSettingsRepository(storage);
    const controller = createOnboardingController(
      settingsRepository,
      {
        queryLifecycle: async () => ({
          type: "lifecycleResult",
          state: "ready",
          hostVersion: "1.0.0",
          protocolVersion: "1.0",
          extensionIdAllowlistStatus: "valid",
          integrityStatus: "valid",
          recoveryAction: null
        }),
        runHealthCheck: async (provider) => ({
          ...createUnknownProviderHealth(provider),
          state: "ready"
        })
      },
      createSetupDiagnosticsRecorder()
    );

    await controller.initialize();
    await controller.advance();
    expect(controller.snapshot().onboarding.currentStep).toBe("privacy");

    await controller.advance();
    expect(controller.snapshot().onboarding.currentStep).toBe("privacy");

    controller.setConsentAccepted(true);
    await controller.advance();
    expect(controller.snapshot().onboarding.currentStep).toBe("companion");
  });
});
