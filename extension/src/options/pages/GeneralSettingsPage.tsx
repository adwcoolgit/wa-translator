import React from "react";

import type { LocalDataActionId } from "../../domain/settings/localDataActions";
import {
  getSetupStatusLabel,
  startupBehaviorOptions,
  type SettingsValidationMessages
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { en } from "../../shared/i18n/en";

export interface GeneralSettingsPageProps {
  settings: UserSettings;
  validationMessages: SettingsValidationMessages;
  localDataStatusMessage: string | null;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
  onResumeOnboarding?: () => void;
  onRequestDestructiveAction?: (actionId: LocalDataActionId) => void;
}

export function GeneralSettingsPage({
  settings,
  validationMessages,
  localDataStatusMessage,
  onFieldChange,
  onResumeOnboarding,
  onRequestDestructiveAction
}: GeneralSettingsPageProps) {
  return (
    <section aria-labelledby="general-settings-title">
      <h2 id="general-settings-title">{en.options.sections.general}</h2>
      <p>{en.options.generalDescription}</p>

      <div className="options-field-grid">
        <label>
          <input
            checked={settings.enabled}
            onChange={(event) => {
              onFieldChange("enabled", event.currentTarget.checked);
            }}
            type="checkbox"
          />
          {en.popup.enableLabel}
        </label>

        <label>
          {en.options.startupBehaviorLabel}
          <select
            aria-label={en.options.startupBehaviorLabel}
            onChange={(event) => {
              onFieldChange(
                "startupBehavior",
                event.currentTarget.value as UserSettings["startupBehavior"]
              );
            }}
            value={settings.startupBehavior}
          >
            {startupBehaviorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          UI language
          <select
            aria-label="UI language"
            onChange={(event) => {
              onFieldChange("uiLanguage", event.currentTarget.value);
            }}
            value={settings.uiLanguage}
          >
            <option value="id">Indonesian</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <section aria-labelledby="general-setup-status-title">
        <h3 id="general-setup-status-title">{en.options.setupStatusLabel}</h3>
        <p>
          Current setup state: <strong>{getSetupStatusLabel(settings)}</strong>
        </p>
        <p>{en.options.startupBehaviorHelp}</p>
        <button onClick={onResumeOnboarding} type="button">
          {en.common.actions.resumeOnboarding}
        </button>
      </section>

      <section aria-labelledby="general-data-actions-title">
        <h3 id="general-data-actions-title">{en.options.destructiveActionHeading}</h3>
        <p>{en.options.clearLocalDataImpact}</p>
        <p>{en.options.resetSettingsImpact}</p>
        <div>
          <button
            onClick={() => {
              onRequestDestructiveAction?.("clearLocalData");
            }}
            type="button"
          >
            {en.options.clearLocalDataLabel}
          </button>
          <button
            onClick={() => {
              onRequestDestructiveAction?.("resetSettings");
            }}
            type="button"
          >
            {en.options.resetSettingsLabel}
          </button>
        </div>
        {localDataStatusMessage ? <p role="status">{localDataStatusMessage}</p> : null}
        {validationMessages.form ? <p role="alert">{validationMessages.form}</p> : null}
      </section>
    </section>
  );
}
