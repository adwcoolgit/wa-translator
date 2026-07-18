import React, { useDeferredValue, useState } from "react";

import {
  buildRecentTargetLanguageEntries,
  incomingModeOptions,
  sourceLanguageOptions,
  type SettingsValidationMessages
} from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { en } from "../../shared/i18n/en";

export interface TranslationSettingsPageProps {
  settings: UserSettings;
  validationMessages: SettingsValidationMessages;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
}

export function TranslationSettingsPage({
  settings,
  validationMessages,
  onFieldChange
}: TranslationSettingsPageProps) {
  const [targetFilter, setTargetFilter] = useState("");
  const deferredFilter = useDeferredValue(targetFilter.trim().toLowerCase());
  const targetOptions = sourceLanguageOptions.filter((option) => {
    if (option.value === "auto") {
      return false;
    }

    if (!deferredFilter) {
      return true;
    }

    return (
      option.label.toLowerCase().includes(deferredFilter) ||
      option.value.toLowerCase().includes(deferredFilter)
    );
  });
  const recentLanguages = buildRecentTargetLanguageEntries(settings.recentTargetLanguages);

  return (
    <section aria-labelledby="translation-settings-title">
      <h2 id="translation-settings-title">{en.options.sections.translation}</h2>
      <p>{en.options.translationDescription}</p>
      <p>{en.options.dirtySummary}</p>

      <div className="options-field-grid">
        <label>
          {en.popup.sourceLanguageLabel}
          <select
            aria-label={en.popup.sourceLanguageLabel}
            onChange={(event) => {
              onFieldChange("sourceLanguage", event.currentTarget.value);
            }}
            value={settings.sourceLanguage}
          >
            {sourceLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Search target languages
          <input
            aria-label="Search target languages"
            onChange={(event) => {
              setTargetFilter(event.currentTarget.value);
            }}
            type="search"
            value={targetFilter}
          />
        </label>

        <label>
          {en.popup.targetLanguageLabel}
          <select
            aria-label={en.popup.targetLanguageLabel}
            onChange={(event) => {
              onFieldChange("targetLanguage", event.currentTarget.value);
            }}
            value={settings.targetLanguage}
          >
            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {en.popup.incomingModeLabel}
          <select
            aria-label={en.popup.incomingModeLabel}
            onChange={(event) => {
              onFieldChange("incomingMode", event.currentTarget.value as UserSettings["incomingMode"]);
            }}
            value={settings.incomingMode}
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
            aria-label="Manual mode"
            onChange={(event) => {
              onFieldChange("manualMode", event.currentTarget.value as UserSettings["manualMode"]);
            }}
            value={settings.manualMode}
          >
            <option value="preview">Preview</option>
            <option value="directReplace">Direct replace</option>
          </select>
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
      </div>

      <section aria-labelledby="translation-recent-languages-title">
        <h3 id="translation-recent-languages-title">{en.options.recentTargetLanguagesLabel}</h3>
        {recentLanguages.length > 0 ? (
          <div>
            {recentLanguages.map((entry) => (
              <button
                key={entry.code}
                onClick={() => {
                  onFieldChange("targetLanguage", entry.code);
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : (
          <p>{en.options.recentTargetLanguagesEmpty}</p>
        )}
        <p>{en.options.recentTargetLanguagesHelp}</p>
      </section>
    </section>
  );
}
