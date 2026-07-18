import { describe, expect, it, vi } from "vitest";

import { createSetupDiagnosticsRecorder } from "../../../src/diagnostics/setupDiagnostics";
import { createUnknownProviderHealth } from "../../../src/domain/provider/providerHealth";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository
} from "../../../src/domain/settings/settingsRepository";
import { createOnboardingController } from "../../../src/onboarding/onboardingController";

describe("OnboardingController", () => {
  it("restores persisted onboarding progress for incomplete setup", async () => {
    const storage = createMemoryPersistentStorageArea();
    const settingsRepository = createSettingsRepository(storage);

    await settingsRepository.save({
      onboardingStatus: "inProgress",
      onboardingProgress: {
        currentStep: "provider",
        consentAccepted: true
      },
      providerActive: "claude",
      targetLanguage: "ja",
      styleId: "formal"
    });

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

    const snapshot = controller.snapshot();

    expect(snapshot.onboarding.currentStep).toBe("provider");
    expect(snapshot.onboarding.consentAccepted).toBe(true);
    expect(snapshot.settings.providerActive).toBe("claude");
    expect(snapshot.settings.targetLanguage).toBe("ja");
    expect(snapshot.settings.styleId).toBe("formal");
    expect(snapshot.lifecycle.state).toBe("ready");
  });

  it("persists provider and preferences while onboarding is still in progress", async () => {
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
    controller.setConsentAccepted(true);
    controller.setProvider("claude");
    controller.updatePreference("targetLanguage", "en");
    controller.updatePreference("manualMode", "directReplace");

    await vi.waitFor(async () => {
      const savedSettings = await settingsRepository.load();
      expect(savedSettings.providerActive).toBe("claude");
      expect(savedSettings.targetLanguage).toBe("en");
      expect(savedSettings.manualMode).toBe("directReplace");
      expect(savedSettings.onboardingStatus).toBe("inProgress");
    });
  });
});
