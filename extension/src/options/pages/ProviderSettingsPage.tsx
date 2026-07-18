import React from "react";

import { alignProviderHealthToProvider } from "../../domain/provider/providerHealth";
import {
  getAutoDetectedPathSummary,
  getLastHealthResultLabel,
  getProviderOverrideState,
  getProviderStatusLabel,
  providerOptions,
  type SettingsValidationMessages
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { presentRecoverableError } from "../../shared/errors/recoverableErrorPresenter";
import { en } from "../../shared/i18n/en";
import type { ProviderHealth } from "../../domain/provider/providerHealth";

export interface ProviderSettingsPageProps {
  providerHealth: ProviderHealth;
  settings: UserSettings;
  validationMessages: SettingsValidationMessages;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
  onRunHealthCheck?: () => void;
}

export function ProviderSettingsPage({
  providerHealth,
  settings,
  validationMessages,
  onFieldChange,
  onRunHealthCheck
}: ProviderSettingsPageProps) {
  const alignedProviderHealth = alignProviderHealthToProvider(settings.providerActive, providerHealth);
  const overrideState = getProviderOverrideState(settings);
  const recoverableError = alignedProviderHealth.lastSanitizedError
    ? presentRecoverableError(alignedProviderHealth.lastSanitizedError)
    : null;

  return (
    <section aria-labelledby="provider-settings-title">
      <h2 id="provider-settings-title">{en.options.sections.provider}</h2>
      <p>{en.options.providerDescription}</p>
      <dl>
        <div>
          <dt>{en.options.providerStatusLabel}</dt>
          <dd>{getProviderStatusLabel(alignedProviderHealth.state)}</dd>
        </div>
        <div>
          <dt>Last health result</dt>
          <dd>{getLastHealthResultLabel(alignedProviderHealth)}</dd>
        </div>
        <div>
          <dt>{en.options.autoDetectedPathLabel}</dt>
          <dd>{getAutoDetectedPathSummary(settings.providerActive)}</dd>
        </div>
        <div>
          <dt>{en.options.safeProfileLabel}</dt>
          <dd>Translation-only execution profile. No auto-send or raw chat persistence.</dd>
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
          {en.options.manualOverrideLabel}
          <input
            aria-invalid={validationMessages.providerExecutablePathOverride ? "true" : "false"}
            aria-label={en.options.manualOverrideLabel}
            onChange={(event) => {
              onFieldChange(
                "providerExecutablePathOverride",
                event.currentTarget.value.trim() ? event.currentTarget.value.trim() : null
              );
            }}
            placeholder="C:\Tools\provider.exe"
            type="text"
            value={settings.providerExecutablePathOverride ?? ""}
          />
        </label>
        <p>Leave the manual override blank to keep using the auto-detected executable path.</p>

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

      <section aria-labelledby="provider-validation-title">
        <h3 id="provider-validation-title">{en.options.validationActionsLabel}</h3>
        <p>
          Manual override state: <strong>{overrideState}</strong>
        </p>
        {validationMessages.providerExecutablePathOverride ? (
          <p role="alert">Choose an absolute executable path ending in .cmd, .exe, .bat, .ps1, or .sh.</p>
        ) : null}
        {recoverableError ? (
          <p>
            {recoverableError.title}: {recoverableError.body}
          </p>
        ) : null}
        <button onClick={onRunHealthCheck} type="button">
          Run synthetic health check
        </button>
      </section>
    </section>
  );
}
