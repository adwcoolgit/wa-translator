import React from "react";

import type { ProviderHealth } from "../../domain/provider/providerHealth";
import type {
  OptionsSectionId,
  SettingsValidationMessages,
  ShortcutStatusModel
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { disclaimerCopy } from "../../shared/i18n/disclaimerCopy";
import { en } from "../../shared/i18n/en";

export interface PrivacyDiagnosticsPageProps {
  activeSection: Extract<OptionsSectionId, "privacy" | "diagnostics">;
  providerHealth: ProviderHealth;
  settings: UserSettings;
  shortcutStatus: ShortcutStatusModel;
  validationMessages: SettingsValidationMessages;
  diagnosticsPreview: string | null;
  diagnosticsStatusMessage: string | null;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
  onPrepareDiagnosticsExport?: () => void;
  onDownloadDiagnosticsExport?: () => void;
}

export function PrivacyDiagnosticsPage({
  activeSection,
  providerHealth,
  settings,
  shortcutStatus,
  validationMessages,
  diagnosticsPreview,
  diagnosticsStatusMessage,
  onFieldChange,
  onPrepareDiagnosticsExport,
  onDownloadDiagnosticsExport
}: PrivacyDiagnosticsPageProps) {
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
        <p>{disclaimerCopy.about}</p>
        <p>Exports stay operational and content-free so message text never appears in diagnostics.</p>
        <div>
          <button onClick={onPrepareDiagnosticsExport} type="button">
            Prepare diagnostics export
          </button>
          <button disabled={!diagnosticsPreview} onClick={onDownloadDiagnosticsExport} type="button">
            Download export
          </button>
        </div>
        {diagnosticsStatusMessage ? <p role="status">{diagnosticsStatusMessage}</p> : null}
        {diagnosticsPreview ? (
          <label>
            Diagnostics preview
            <textarea aria-label="Diagnostics preview" readOnly rows={10} value={diagnosticsPreview} />
          </label>
        ) : (
          <p>{en.options.diagnosticsPlaceholder}</p>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby="privacy-settings-title">
      <h2 id="privacy-settings-title">{en.options.sections.privacy}</h2>
      <p>{en.options.privacyDescription}</p>
      <p>{en.options.privacyPromise}</p>
      <p>{disclaimerCopy.privacy}</p>
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

      <section aria-labelledby="privacy-impact-title">
        <h3 id="privacy-impact-title">Operational impact</h3>
        <p>{en.options.clearLocalDataImpact}</p>
        <p>{en.options.resetSettingsImpact}</p>
      </section>
    </section>
  );
}
