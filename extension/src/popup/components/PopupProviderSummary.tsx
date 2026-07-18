import React from "react";

import type { ProviderHealth } from "../../domain/provider/providerHealth";
import {
  getPopupProviderSummary,
  getProviderStateBadgeTone,
  getProviderStatusLabel
} from "../../domain/settings/settingsViewModel";
import { StateBadge } from "../../shared/components/StateBadge";
import { en } from "../../shared/i18n/en";

export interface PopupProviderSummaryProps {
  providerHealth: ProviderHealth;
}

export function PopupProviderSummary({ providerHealth }: PopupProviderSummaryProps) {
  return (
    <div aria-label={en.popup.providerSummaryLabel} className="popup-provider-summary">
      <div>
        <p>{en.popup.providerLabel}</p>
        <strong>{providerHealth.provider.toUpperCase()}</strong>
      </div>
      <div>
        <StateBadge
          label={getProviderStatusLabel(providerHealth.state)}
          size="compact"
          supportingText={providerHealth.lastLatencyBucket ?? undefined}
          tone={getProviderStateBadgeTone(providerHealth.state)}
        />
        <p>{getPopupProviderSummary(providerHealth.state)}</p>
      </div>
    </div>
  );
}
