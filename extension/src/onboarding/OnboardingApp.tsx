import React, { startTransition, useEffect, useEffectEvent, useState } from "react";

import {
  getIncomingModeLabel,
  getLanguageLabel,
  getStyleLabel,
  incomingModeOptions,
  sourceLanguageOptions,
  styleOptions
} from "../domain/settings/settingsViewModel";
import { createOnboardingController, type OnboardingController, type OnboardingViewModel } from "./onboardingController";
import { CompanionStatusCard } from "./components/CompanionStatusCard";
import { PrivacyDisclosure } from "./components/PrivacyDisclosure";
import { ProviderHealthStep } from "./components/ProviderHealthStep";

export interface OnboardingAppProps {
  controller?: OnboardingController;
}

const STEP_TITLES: Record<OnboardingViewModel["onboarding"]["currentStep"], string> = {
  welcome: "Welcome",
  privacy: "Privacy",
  companion: "Companion",
  provider: "Provider",
  preferences: "Preferences",
  ready: "Ready"
};

const STEP_ACTION_LABELS: Record<OnboardingViewModel["onboarding"]["currentStep"], string> = {
  welcome: "Review privacy",
  privacy: "Continue to companion",
  companion: "Continue to provider",
  provider: "Continue to preferences",
  preferences: "Save preferences",
  ready: "Finish setup"
};

const syncViewModel = (
  controller: OnboardingController,
  setViewModel: React.Dispatch<React.SetStateAction<OnboardingViewModel>>
): void => {
  const snapshot = controller.snapshot();
  startTransition(() => {
    setViewModel(snapshot);
  });
};

export function OnboardingApp({ controller = createOnboardingController() }: OnboardingAppProps) {
  const [viewModel, setViewModel] = useState<OnboardingViewModel>(() => controller.snapshot());

  const refreshFromController = useEffectEvent(() => {
    syncViewModel(controller, setViewModel);
  });

  const runAsyncOperation = useEffectEvent(async (operation: () => Promise<void>) => {
    await operation();
    refreshFromController();
  });

  useEffect(() => {
    void runAsyncOperation(() => controller.initialize());
  }, [controller, runAsyncOperation]);

  const currentStep = viewModel.onboarding.currentStep;

  return (
    <main className="onboarding-shell" data-surface="onboarding">
      <header className="onboarding-hero">
        <p className="eyebrow">WA Translator setup</p>
        <h1>First-time setup and trust</h1>
        <p>
          Set up the local companion, confirm the privacy boundary, and finish a synthetic provider
          health check before WA Translator can process any translation request.
        </p>
      </header>

      <div className="onboarding-layout">
        <aside aria-label="Onboarding progress" className="onboarding-progress">
          <ol>
            {Object.entries(STEP_TITLES).map(([step, label]) => (
              <li
                aria-current={step === currentStep ? "step" : undefined}
                className={step === currentStep ? "current" : undefined}
                key={step}
              >
                {label}
              </li>
            ))}
          </ol>
        </aside>

        <section className="onboarding-content">
          {currentStep === "welcome" ? (
            <section aria-labelledby="welcome-title" className="onboarding-card">
              <h2 id="welcome-title">Welcome to WA Translator</h2>
              <p>
                WA Translator works in WhatsApp Web on Chrome desktop and keeps the original chat
                intact. Automatic and manual translation remain reversible, and no setup step can
                reach the provider before you review the trust disclosure.
              </p>
            </section>
          ) : null}

          {currentStep === "privacy" ? (
            <PrivacyDisclosure
              consentAccepted={viewModel.onboarding.consentAccepted}
              onConsentChange={(accepted) => {
                controller.setConsentAccepted(accepted);
                refreshFromController();
              }}
            />
          ) : null}

          {currentStep === "companion" ? (
            <CompanionStatusCard
              lifecycle={viewModel.lifecycle}
              loading={viewModel.loading}
              onRefresh={() => controller.refreshLifecycle()}
            />
          ) : null}

          {currentStep === "provider" ? (
            <ProviderHealthStep
              loading={viewModel.loading}
              onProviderChange={(provider) => {
                controller.setProvider(provider);
                refreshFromController();
              }}
              onRunHealthCheck={() => controller.runSelectedProviderHealthCheck()}
              providerHealth={viewModel.providerHealth}
              selectedProvider={viewModel.settings.providerActive}
            />
          ) : null}

          {currentStep === "preferences" ? (
            <section aria-labelledby="preferences-title" className="onboarding-card">
              <h2 id="preferences-title">Initial preferences</h2>
              <p>Choose safe defaults now. You can refine them later in Settings with explicit Save changes.</p>
              <div className="preferences-grid">
                <label>
                  Source language
                  <select
                    onChange={(event) => {
                      controller.updatePreference("sourceLanguage", event.currentTarget.value);
                      refreshFromController();
                    }}
                    value={viewModel.settings.sourceLanguage}
                  >
                    {sourceLanguageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Target language
                  <select
                    onChange={(event) => {
                      controller.updatePreference("targetLanguage", event.currentTarget.value);
                      refreshFromController();
                    }}
                    value={viewModel.settings.targetLanguage}
                  >
                    {sourceLanguageOptions
                      .filter((option) => option.value !== "auto")
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Style
                  <select
                    onChange={(event) => {
                      controller.updatePreference("styleId", event.currentTarget.value as typeof viewModel.settings.styleId);
                      refreshFromController();
                    }}
                    value={viewModel.settings.styleId}
                  >
                    {styleOptions
                      .filter((option) => option.value !== "custom")
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Incoming mode
                  <select
                    onChange={(event) => {
                      controller.updatePreference("incomingMode", event.currentTarget.value as typeof viewModel.settings.incomingMode);
                      refreshFromController();
                    }}
                    value={viewModel.settings.incomingMode}
                  >
                    {incomingModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Manual mode
                  <select
                    onChange={(event) => {
                      controller.updatePreference("manualMode", event.currentTarget.value as typeof viewModel.settings.manualMode);
                      refreshFromController();
                    }}
                    value={viewModel.settings.manualMode}
                  >
                    <option value="preview">Preview</option>
                    <option value="directReplace">Direct replace</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {currentStep === "ready" ? (
            <section aria-labelledby="ready-title" className="onboarding-card">
              <h2 id="ready-title">Setup is ready</h2>
              <p>
                Consent is stored, the local companion is ready, and the provider passed the
                synthetic health check. Finish setup, then open WhatsApp Web to start using the
                saved defaults below.
              </p>
              <dl>
                <div>
                  <dt>Provider</dt>
                  <dd>{viewModel.settings.providerActive}</dd>
                </div>
                <div>
                  <dt>Target language</dt>
                  <dd>{getLanguageLabel(viewModel.settings.targetLanguage)}</dd>
                </div>
                <div>
                  <dt>Style</dt>
                  <dd>{getStyleLabel(viewModel.settings.styleId)}</dd>
                </div>
                <div>
                  <dt>Incoming mode</dt>
                  <dd>{getIncomingModeLabel(viewModel.settings.incomingMode)}</dd>
                </div>
              </dl>
              <p>
                <a href="https://web.whatsapp.com/" rel="noreferrer" target="_blank">
                  Open WhatsApp Web
                </a>
              </p>
            </section>
          ) : null}

          <footer className="onboarding-actions">
            <button
              disabled={currentStep === "welcome" || viewModel.loading}
              onClick={() => {
                controller.goBack();
                refreshFromController();
              }}
              type="button"
            >
              Back
            </button>
            <button
              disabled={!viewModel.onboarding.canContinue || viewModel.loading}
              onClick={() => {
                void runAsyncOperation(() => controller.advance());
              }}
              type="button"
            >
              {STEP_ACTION_LABELS[currentStep]}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
