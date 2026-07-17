import { describe, expect, it } from "vitest";

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
      }
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
    expect(snapshot.settings.onboardingProgress.currentStep).toBe("provider");
  });
});
