import React, { startTransition, useEffect, useEffectEvent, useState } from "react";

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
          Siapkan local companion, pilih provider, dan verifikasi health check synthetic sebelum
          WA Translator dapat memproses terjemahan apa pun.
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
              <h2 id="welcome-title">Start with safe defaults</h2>
              <p>
                WA Translator bekerja di WhatsApp Web pada Chrome desktop, Windows-first, dan
                tidak pernah auto-send. Setup ini memblokir akses provider sampai disclosure,
                companion, dan health check selesai.
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
              <div className="preferences-grid">
                <label>
                  Source language
                  <input
                    onChange={(event) => {
                      controller.updatePreference("sourceLanguage", event.currentTarget.value);
                      refreshFromController();
                    }}
                    type="text"
                    value={viewModel.settings.sourceLanguage}
                  />
                </label>
                <label>
                  Target language
                  <input
                    onChange={(event) => {
                      controller.updatePreference("targetLanguage", event.currentTarget.value);
                      refreshFromController();
                    }}
                    type="text"
                    value={viewModel.settings.targetLanguage}
                  />
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
                    <option value="neutral">Neutral</option>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="concise">Concise</option>
                    <option value="polite">Polite</option>
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
                    <option value="inline">Inline</option>
                    <option value="tooltip">Tooltip</option>
                    <option value="onDemand">On demand</option>
                    <option value="off">Off</option>
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
                Consent sudah diterima, companion sudah siap, dan provider health check synthetic
                sudah lolos. Setelah Anda menyelesaikan langkah ini, WA Translator boleh memproses
                permintaan terjemahan sesuai pengaturan awal Anda.
              </p>
              <dl>
                <div>
                  <dt>Provider</dt>
                  <dd>{viewModel.settings.providerActive}</dd>
                </div>
                <div>
                  <dt>Target language</dt>
                  <dd>{viewModel.settings.targetLanguage}</dd>
                </div>
                <div>
                  <dt>Incoming mode</dt>
                  <dd>{viewModel.settings.incomingMode}</dd>
                </div>
              </dl>
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
              {currentStep === "ready" ? "Finish setup" : "Continue"}
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
