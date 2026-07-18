import React from "react";

import type { UserSettings } from "../../domain/settings/userSettings";
import {
  buildRecentTargetLanguageEntries,
  languageOptions,
  styleOptions
} from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface LanguageStyleControlsProps {
  disabled?: boolean;
  targetLanguage: UserSettings["targetLanguage"];
  styleId: UserSettings["styleId"];
  allowCustomStyle?: boolean;
  recentTargetLanguages?: readonly string[];
  onTargetLanguageChange: (value: UserSettings["targetLanguage"]) => void;
  onStyleChange: (value: UserSettings["styleId"]) => void;
}

export function LanguageStyleControls({
  disabled = false,
  targetLanguage,
  styleId,
  allowCustomStyle = true,
  recentTargetLanguages = [],
  onTargetLanguageChange,
  onStyleChange
}: LanguageStyleControlsProps) {
  const availableStyleOptions = allowCustomStyle
    ? styleOptions
    : styleOptions.filter((option) => option.value !== "custom");
  const recentEntries = buildRecentTargetLanguageEntries(recentTargetLanguages);
  const recentCodes = new Set(recentEntries.map((entry) => entry.code));

  return (
    <div className="popup-control-grid">
      <label>
        {en.popup.targetLanguageLabel}
        <select
          aria-label={en.popup.targetLanguageLabel}
          disabled={disabled}
          onChange={(event) => {
            onTargetLanguageChange(event.currentTarget.value as UserSettings["targetLanguage"]);
          }}
          value={targetLanguage}
        >
          {recentEntries.length > 0 ? (
            <optgroup label={en.popup.recentLanguagesLabel}>
              {recentEntries.map((option) => (
                <option key={`recent-${option.code}`} value={option.code}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          <optgroup label={en.popup.allLanguagesLabel}>
            {languageOptions
              .filter((option) => !recentCodes.has(option.value as (typeof recentEntries)[number]["code"]))
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </optgroup>
        </select>
      </label>

      <label>
        {en.popup.styleLabel}
        <select
          aria-label={en.popup.styleLabel}
          disabled={disabled}
          onChange={(event) => {
            onStyleChange(event.currentTarget.value as UserSettings["styleId"]);
          }}
          value={styleId}
        >
          {availableStyleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
