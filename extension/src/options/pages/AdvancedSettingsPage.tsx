import React from "react";

import { en } from "../../shared/i18n/en";

export function AdvancedSettingsPage() {
  return (
    <section aria-labelledby="advanced-settings-title">
      <h2 id="advanced-settings-title">{en.options.sections.advanced}</h2>
      <p>{en.options.advancedHidden}</p>
    </section>
  );
}
