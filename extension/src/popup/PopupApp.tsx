import React from "react";

import { createUnknownProviderHealth, type ProviderHealth } from "../domain/provider/providerHealth";
import {
  createDefaultShortcutStatusModel,
  getIncomingModeLabel,
  getLanguageLabel,
  getProviderStatusLabel,
  getStyleLabel,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import { type UserSettings } from "../domain/settings/userSettings";
import type { RecoveryAction } from "../shared/contracts/diagnostics";
import { RecoveryActionPanel } from "../shared/components/RecoveryActionPanel";
import { en } from "../shared/i18n/en";
import { IncomingModeSelector } from "./components/IncomingModeSelector";
import { LanguageStyleControls } from "./components/LanguageStyleControls";

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
  providerHealth?: ProviderHealth;
  shortcutStatus?: ShortcutStatusModel;
  onToggleEnabled?: (value: boolean) => void;
  onTargetLanguageChange?: (value: UserSettings["targetLanguage"]) => void;
  onStyleChange?: (value: UserSettings["styleId"]) => void;
  onIncomingModeChange?: (value: UserSettings["incomingMode"]) => void;
  onRecoveryAction?: (action: RecoveryAction) => void;
}

export function PopupApp({
  loading,
  settings,
  providerHealth = createUnknownProviderHealth(settings.providerActive),
  shortcutStatus = createDefaultShortcutStatusModel(),
  onToggleEnabled,
  onTargetLanguageChange,
  onStyleChange,
  onIncomingModeChange,
  onRecoveryAction
}: PopupAppProps) {
  if (loading) {
    return <main data-surface="popup">{en.popup.loading}</main>;
  }

  if (settings.onboardingStatus !== "complete") {
    return (
      <main data-surface="popup">
        <header>
          <p>{en.appName}</p>
          <h1>{en.popup.setupPendingTitle}</h1>
        </header>
        <p>{en.popup.setupPendingBody}</p>
        <dl>
          <div>
            <dt>{en.popup.providerLabel}</dt>
            <dd>{settings.providerActive}</dd>
          </div>
          <div>
            <dt>{en.popup.targetLanguageLabel}</dt>
            <dd>{getLanguageLabel(settings.targetLanguage)}</dd>
          </div>
          <div>
            <dt>{en.popup.incomingModeLabel}</dt>
            <dd>{getIncomingModeLabel(settings.incomingMode)}</dd>
          </div>
        </dl>
        <div>
          <button onClick={() => void openOnboarding()} type="button">
            {en.popup.resumeOnboarding}
          </button>
          <button onClick={() => void openOptions()} type="button">
            {en.popup.openSettings}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main data-surface="popup">
      <header>
        <p>{en.appName}</p>
        <h1>{en.popup.dailyControlsTitle}</h1>
        <label>
          <input
            checked={settings.enabled}
            onChange={(event) => {
              onToggleEnabled?.(event.currentTarget.checked);
            }}
            type="checkbox"
          />
          {en.popup.enableLabel}
        </label>
      </header>
      <dl>
        <div>
          <dt>{en.popup.providerLabel}</dt>
          <dd>
            {settings.providerActive.toUpperCase()} | {getProviderStatusLabel(providerHealth.state)}
          </dd>
        </div>
        <div>
          <dt>{en.popup.targetLanguageLabel}</dt>
          <dd>{getLanguageLabel(settings.targetLanguage)}</dd>
        </div>
        <div>
          <dt>{en.popup.styleLabel}</dt>
          <dd>{getStyleLabel(settings.styleId)}</dd>
        </div>
        <div>
          <dt>{en.popup.manualShortcutLabel}</dt>
          <dd>{shortcutStatus.shortcut ?? en.shortcuts.unassigned}</dd>
        </div>
      </dl>

      <LanguageStyleControls
        allowCustomStyle={settings.customStyle !== null}
        onStyleChange={(value) => {
          onStyleChange?.(value);
        }}
        onTargetLanguageChange={(value) => {
          onTargetLanguageChange?.(value);
        }}
        styleId={settings.styleId}
        targetLanguage={settings.targetLanguage}
      />

      <IncomingModeSelector
        onChange={(value) => {
          onIncomingModeChange?.(value);
        }}
        value={settings.incomingMode}
      />

      <section aria-labelledby="popup-manual-section-title">
        <h2 id="popup-manual-section-title">{en.popup.manualShortcutLabel}</h2>
        <p>{shortcutStatus.summary}</p>
        <p>{shortcutStatus.details}</p>
        <p>{en.popup.manualShortcutHelp}</p>
      </section>

      {providerHealth.lastSanitizedError ? (
        <section aria-labelledby="popup-recovery-title">
          <h2 id="popup-recovery-title">Recovery</h2>
          <p>{en.popup.diagnosticsHint}</p>
          <RecoveryActionPanel
            compact
            error={providerHealth.lastSanitizedError}
            onAction={(action) => {
              onRecoveryAction?.(action);
            }}
          />
        </section>
      ) : null}

      <button onClick={() => void openOptions()} type="button">
        {en.popup.openSettings}
      </button>
    </main>
  );
}