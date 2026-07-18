// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createSetupDiagnosticsRecorder } from "../../../src/diagnostics/setupDiagnostics";
import { createUnknownProviderHealth } from "../../../src/domain/provider/providerHealth";
import {
  createMemoryPersistentStorageArea,
  createSettingsRepository
} from "../../../src/domain/settings/settingsRepository";
import { OnboardingApp } from "../../../src/onboarding/OnboardingApp";
import { PrivacyDisclosure } from "../../../src/onboarding/components/PrivacyDisclosure";
import { createOnboardingController } from "../../../src/onboarding/onboardingController";

describe("onboarding privacy and flow surfaces", () => {
  it("renders independent-product, no-auto-send, and synthetic health check disclosures", () => {
    render(<PrivacyDisclosure consentAccepted={false} onConsentChange={vi.fn()} />);

    expect(screen.getByText(/produk independen/i)).toBeInTheDocument();
    expect(screen.getByText(/WA Translator tidak pernah menekan tombol kirim/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic text/i)).toBeInTheDocument();
  });

  it("emits consent changes when the checkbox is toggled", () => {
    const onConsentChange = vi.fn();
    render(<PrivacyDisclosure consentAccepted={false} onConsentChange={onConsentChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /saya memahami/i }));

    expect(onConsentChange).toHaveBeenCalledWith(true);
  });

  it("moves from welcome to privacy to companion with explicit step actions", async () => {
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

    render(<OnboardingApp controller={controller} />);

    expect(await screen.findByRole("heading", { name: /welcome to wa translator/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /review privacy/i }));
    expect(await screen.findByRole("heading", { name: /privacy and trust disclosure/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /saya memahami/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue to companion/i }));

    expect(await screen.findByRole("heading", { name: /local companion readiness/i })).toBeInTheDocument();
  });
});
