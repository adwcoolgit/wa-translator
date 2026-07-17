import React from "react";

import { type UserSettings } from "../domain/settings/userSettings";

const openOnboarding = async (): Promise<void> => {
  if (typeof chrome === "undefined" || !chrome.tabs?.create || !chrome.runtime?.getURL) {
    return;
  }

  await chrome.tabs.create({
    url: chrome.runtime.getURL("src/onboarding/index.html"),
    active: true
  });
};

const openOptions = async (): Promise<void> => {
  if (typeof chrome === "undefined" || !chrome.runtime?.openOptionsPage) {
    return;
  }

  await chrome.runtime.openOptionsPage();
};

export interface PopupAppProps {
  loading: boolean;
  settings: UserSettings;
}

export function PopupApp({ loading, settings }: PopupAppProps) {
  if (loading) {
    return <main data-surface="popup">Loading WA Translator settings...</main>;
  }

  if (settings.onboardingStatus !== "complete") {
    return (
      <main data-surface="popup">
        <header>
          <p>WA Translator</p>
          <h1>Setup belum selesai</h1>
        </header>
        <p>
          Translasi tetap diblokir sampai privacy disclosure, local companion, dan synthetic
          provider health check selesai.
        </p>
        <dl>
          <div>
            <dt>Provider aktif</dt>
            <dd>{settings.providerActive}</dd>
          </div>
          <div>
            <dt>Target language</dt>
            <dd>{settings.targetLanguage}</dd>
          </div>
          <div>
            <dt>Incoming mode</dt>
            <dd>{settings.incomingMode}</dd>
          </div>
        </dl>
        <div>
          <button onClick={() => void openOnboarding()} type="button">
            Resume onboarding
          </button>
          <button onClick={() => void openOptions()} type="button">
            Open settings
          </button>
        </div>
      </main>
    );
  }

  return (
    <main data-surface="popup">
      <header>
        <p>WA Translator</p>
        <h1>Daily controls</h1>
      </header>
      <dl>
        <div>
          <dt>Provider</dt>
          <dd>{settings.providerActive}</dd>
        </div>
        <div>
          <dt>Translate to</dt>
          <dd>{settings.targetLanguage}</dd>
        </div>
        <div>
          <dt>Incoming</dt>
          <dd>{settings.incomingMode}</dd>
        </div>
        <div>
          <dt>Manual mode</dt>
          <dd>{settings.manualMode}</dd>
        </div>
      </dl>
      <button onClick={() => void openOptions()} type="button">
        Open settings
      </button>
    </main>
  );
}
