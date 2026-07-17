import React from "react";

import type { ProviderHealth } from "../../domain/provider/providerHealth";
import type {
  OptionsSectionId,
  SettingsValidationMessages,
  ShortcutStatusModel
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { en } from "../../shared/i18n/en";

export interface PrivacyDiagnosticsPageProps {
  activeSection: Extract<OptionsSectionId, "privacy" | "diagnostics" | "advanced">;
  providerHealth: ProviderHealth;
  settings: UserSettings;
  shortcutStatus: ShortcutStatusModel;
  validationMessages: SettingsValidationMessages;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
}

export function PrivacyDiagnosticsPage({
  activeSection,
  providerHealth,
  settings,
  shortcutStatus,
  validationMessages,
  onFieldChange
}: PrivacyDiagnosticsPageProps) {
  if (activeSection === "advanced") {
    return (
      <section aria-labelledby="advanced-settings-title">
        <h2 id="advanced-settings-title">{en.options.sections.advanced}</h2>
        <p>{en.options.advancedHidden}</p>
      </section>
    );
  }

  if (activeSection === "diagnostics") {
    return (
      <section aria-labelledby="diagnostics-settings-title">
        <h2 id="diagnostics-settings-title">{en.options.sections.diagnostics}</h2>
        <p>{en.options.diagnosticsDescription}</p>
        <dl>
          <div>
            <dt>{en.options.providerStatusLabel}</dt>
            <dd>{en.providerStates[providerHealth.state]}</dd>
          </div>
          <div>
            <dt>{en.popup.manualShortcutLabel}</dt>
            <dd>{shortcutStatus.shortcut ?? en.shortcuts.unassigned}</dd>
          </div>
          <div>
            <dt>{en.options.telemetryLabel}</dt>
            <dd>{settings.telemetryEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
        <p>{en.options.diagnosticsPlaceholder}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="privacy-settings-title">
      <h2 id="privacy-settings-title">{en.options.sections.privacy}</h2>
      <p>{en.options.privacyDescription}</p>
      <p>{en.options.privacyPromise}</p>
      <div className="options-field-grid">
        <label>
          <input
            checked={settings.sessionCacheEnabled}
            onChange={(event) => {
              onFieldChange("sessionCacheEnabled", event.currentTarget.checked);
            }}
            type="checkbox"
          />
          {en.options.sessionCacheLabel}
        </label>

        <label>
          {en.options.sessionCacheTtlLabel}
          <input
            aria-invalid={validationMessages.sessionCacheTtlMinutes ? "true" : "false"}
            aria-label={en.options.sessionCacheTtlLabel}
            min={1}
            onChange={(event) => {
              onFieldChange("sessionCacheTtlMinutes", Number.parseInt(event.currentTarget.value, 10) || 0);
            }}
            type="number"
            value={settings.sessionCacheTtlMinutes}
          />
        </label>

        <label>
          {en.options.undoSecondsLabel}
          <input
            aria-invalid={validationMessages.undoSeconds ? "true" : "false"}
            aria-label={en.options.undoSecondsLabel}
            min={5}
            onChange={(event) => {
              onFieldChange("undoSeconds", Number.parseInt(event.currentTarget.value, 10) || 0);
            }}
            type="number"
            value={settings.undoSeconds}
          />
        </label>

        <label>
          <input
            checked={settings.telemetryEnabled}
            onChange={(event) => {
              onFieldChange("telemetryEnabled", event.currentTarget.checked);
            }}
            type="checkbox"
          />
          {en.options.telemetryLabel}
        </label>
      </div>
    </section>
  );
}
