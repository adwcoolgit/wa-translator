import React from "react";

import type { UserSettings } from "../../domain/settings/userSettings";
import { incomingModeOptions } from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface IncomingModeSelectorProps {
  disabled?: boolean;
  value: UserSettings["incomingMode"];
  onChange: (value: UserSettings["incomingMode"]) => void;
}

export function IncomingModeSelector({
  disabled = false,
  value,
  onChange
}: IncomingModeSelectorProps) {
  return (
    <label>
      {en.popup.incomingModeLabel}
      <select
        aria-label={en.popup.incomingModeLabel}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.currentTarget.value as UserSettings["incomingMode"]);
        }}
        value={value}
      >
        {incomingModeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
