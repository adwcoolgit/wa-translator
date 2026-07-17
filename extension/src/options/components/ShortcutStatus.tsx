import React from "react";

import type { ShortcutStatusModel } from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface ShortcutStatusProps {
  model: ShortcutStatusModel;
  onOpenShortcutSettings?: () => void;
}

export function ShortcutStatus({ model, onOpenShortcutSettings }: ShortcutStatusProps) {
  return (
    <section aria-labelledby="shortcut-status-title">
      <h2 id="shortcut-status-title">{en.options.sections.shortcuts}</h2>
      <p>{en.options.shortcutDescription}</p>
      <dl>
        <div>
          <dt>{en.popup.manualShortcutLabel}</dt>
          <dd>{model.shortcut ?? en.shortcuts.unassigned}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{model.summary}</dd>
        </div>
      </dl>
      <p>{model.details}</p>
      <button onClick={onOpenShortcutSettings} type="button">
        {en.options.openChromeShortcuts}
      </button>
    </section>
  );
}
