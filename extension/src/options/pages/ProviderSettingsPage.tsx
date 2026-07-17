import React from "react";

import type { ProviderHealth } from "../../domain/provider/providerHealth";
import {
  getLifecycleSummary,
  providerOptions,
  type SettingsValidationMessages
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { en } from "../../shared/i18n/en";

export interface ProviderSettingsPageProps {
  providerHealth: ProviderHealth;
  settings: UserSettings;
  validationMessages: SettingsValidationMessages;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
}

export function ProviderSettingsPage({
  providerHealth,
  settings,
  validationMessages,
  onFieldChange
}: ProviderSettingsPageProps) {
  return (
    <section aria-labelledby="provider-settings-title">
      <h2 id="provider-settings-title">{en.options.sections.provider}</h2>
      <p>{en.options.providerDescription}</p>
      <dl>
        <div>
          <dt>{en.options.lifecycleLabel}</dt>
          <dd>{getLifecycleSummary(providerHealth)}</dd>
        </div>
        <div>
          <dt>{en.options.providerStatusLabel}</dt>
          <dd>{providerHealth.lastSanitizedError?.supportCode ?? en.providerStates[providerHealth.state]}</dd>
        </div>
      </dl>

      <div className="options-field-grid">
        <label>
          {en.options.providerSelectLabel}
          <select
            aria-label={en.options.providerSelectLabel}
            onChange={(event) => {
              onFieldChange("providerActive", event.currentTarget.value as UserSettings["providerActive"]);
            }}
            value={settings.providerActive}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {en.options.providerProfileLabel}
          <input
            aria-label={en.options.providerProfileLabel}
            onChange={(event) => {
              onFieldChange("providerProfile", event.currentTarget.value.trim() ? event.currentTarget.value : null);
            }}
            type="text"
            value={settings.providerProfile ?? ""}
          />
        </label>

        <label>
          {en.options.providerTimeoutLabel}
          <input
            aria-invalid={validationMessages.providerTimeoutSeconds ? "true" : "false"}
            aria-label={en.options.providerTimeoutLabel}
            min={5}
            onChange={(event) => {
              onFieldChange("providerTimeoutSeconds", Number.parseInt(event.currentTarget.value, 10) || 0);
            }}
            type="number"
            value={settings.providerTimeoutSeconds}
          />
        </label>

        <label>
          {en.options.providerConcurrencyLabel}
          <input
            aria-invalid={validationMessages.providerConcurrency ? "true" : "false"}
            aria-label={en.options.providerConcurrencyLabel}
            min={1}
            onChange={(event) => {
              onFieldChange("providerConcurrency", Number.parseInt(event.currentTarget.value, 10) || 0);
            }}
            type="number"
            value={settings.providerConcurrency}
          />
        </label>

        <label>
          {en.options.queueMaxPendingLabel}
          <input
            aria-invalid={validationMessages.queueMaxPending ? "true" : "false"}
            aria-label={en.options.queueMaxPendingLabel}
            min={1}
            onChange={(event) => {
              onFieldChange("queueMaxPending", Number.parseInt(event.currentTarget.value, 10) || 0);
            }}
            type="number"
            value={settings.queueMaxPending}
          />
        </label>
      </div>
    </section>
  );
}
