import React from "react";

import type { UserSettings } from "../../domain/settings/userSettings";
import { languageOptions, styleOptions } from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface LanguageStyleControlsProps {
  disabled?: boolean;
  targetLanguage: UserSettings["targetLanguage"];
  styleId: UserSettings["styleId"];
  allowCustomStyle?: boolean;
  onTargetLanguageChange: (value: UserSettings["targetLanguage"]) => void;
  onStyleChange: (value: UserSettings["styleId"]) => void;
}

export function LanguageStyleControls({
  disabled = false,
  targetLanguage,
  styleId,
  allowCustomStyle = true,
  onTargetLanguageChange,
  onStyleChange
}: LanguageStyleControlsProps) {
  const availableStyleOptions = allowCustomStyle
    ? styleOptions
    : styleOptions.filter((option) => option.value !== "custom");

  return (
    <div className="popup-control-grid">
      <label>
        {en.popup.targetLanguageLabel}
        <select
          aria-label={en.popup.targetLanguageLabel}
          disabled={disabled}
          onChange={(event) => {
            onTargetLanguageChange(event.currentTarget.value);
          }}
          value={targetLanguage}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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