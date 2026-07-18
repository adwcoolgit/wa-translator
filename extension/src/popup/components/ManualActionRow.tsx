import React from "react";

import { type ShortcutStatusModel } from "../../domain/settings/settingsViewModel";
import { StateBadge } from "../../shared/components/StateBadge";
import { en } from "../../shared/i18n/en";

export interface ManualActionRowProps {
  shortcutStatus: ShortcutStatusModel;
  disabled?: boolean;
  disabledReason?: string | null;
  message?: string | null;
  onAction?: () => void;
}

const getShortcutTone = (state: ShortcutStatusModel["state"]) => {
  switch (state) {
    case "assigned":
      return "ready" as const;
    case "conflict":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
};

export function ManualActionRow({
  shortcutStatus,
  disabled = false,
  disabledReason = null,
  message = null,
  onAction
}: ManualActionRowProps) {
  return (
    <section aria-labelledby="popup-manual-section-title" className="popup-manual-row">
      <div>
        <h2 id="popup-manual-section-title">{en.popup.manualSectionTitle}</h2>
        <StateBadge
          label={shortcutStatus.shortcut ?? en.shortcuts.unassigned}
          size="compact"
          supportingText={shortcutStatus.summary}
          tone={getShortcutTone(shortcutStatus.state)}
        />
        <p>{shortcutStatus.details}</p>
        <p>{disabled ? disabledReason : message ?? en.popup.manualActionHelp}</p>
      </div>

      <button disabled={disabled} onClick={onAction} type="button">
        {en.popup.manualActionLabel}
      </button>
    </section>
  );
}
