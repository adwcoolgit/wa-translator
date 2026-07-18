import React from "react";

import type { ProviderHealth } from "../../domain/provider/providerHealth";
import { en } from "../../shared/i18n/en";
import { PopupProviderSummary } from "./PopupProviderSummary";

export interface PopupHeaderProps {
  enabled: boolean;
  providerHealth: ProviderHealth;
  onToggleEnabled?: (value: boolean) => void;
  toggleDisabled?: boolean;
}

export function PopupHeader({
  enabled,
  providerHealth,
  onToggleEnabled,
  toggleDisabled = false
}: PopupHeaderProps) {
  return (
    <header className="popup-header">
      <div>
        <p>{en.appName}</p>
        <h1>{en.popup.dailyControlsTitle}</h1>
      </div>

      <label>
        <input
          checked={enabled}
          disabled={toggleDisabled}
          onChange={(event) => {
            onToggleEnabled?.(event.currentTarget.checked);
          }}
          type="checkbox"
        />
        {en.popup.enableLabel}
      </label>

      <PopupProviderSummary providerHealth={providerHealth} />
    </header>
  );
}
