import React from "react";

import { getStyleLabel, styleOptions } from "../../domain/settings/settingsViewModel";
import type { UserSettings } from "../../domain/settings/userSettings";
import { en } from "../../shared/i18n/en";

export interface StyleSettingsPageProps {
  settings: UserSettings;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
}

const STYLE_DESCRIPTIONS: Record<Exclude<UserSettings["styleId"], "custom">, string> = {
  neutral: "Balanced translation tone for daily chat reading.",
  formal: "More structured wording for professional or official context.",
  casual: "Relaxed wording for conversational chats.",
  friendly: "Warm and approachable tone without changing intent.",
  professional: "Clear, business-safe phrasing with restrained style.",
  concise: "Shorter output when speed matters more than nuance.",
  polite: "Respectful wording for social or service interactions."
};

export function StyleSettingsPage({ settings, onFieldChange }: StyleSettingsPageProps) {
  const selectedStyleDescription =
    settings.styleId === "custom"
      ? "Custom styles apply only after both name and instruction are saved."
      : STYLE_DESCRIPTIONS[settings.styleId];

  return (
    <section aria-labelledby="styles-settings-title">
      <h2 id="styles-settings-title">{en.options.sections.styles}</h2>
      <p>{en.options.stylesDescription}</p>
      <p>Style changes affect future translation requests only and never alter original WhatsApp content.</p>

      <div className="options-field-grid">
        <label>
          {en.popup.styleLabel}
          <select
            aria-label={en.popup.styleLabel}
            onChange={(event) => {
              onFieldChange("styleId", event.currentTarget.value as UserSettings["styleId"]);
            }}
            value={settings.styleId}
          >
            {styleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section aria-labelledby="styles-preview-title">
        <h3 id="styles-preview-title">Current profile</h3>
        <p>
          <strong>{getStyleLabel(settings.styleId)}</strong>
        </p>
        <p>{selectedStyleDescription}</p>
      </section>

      {settings.styleId === "custom" ? (
        <div className="options-field-grid">
          <label>
            {en.options.customStyleNameLabel}
            <input
              aria-label={en.options.customStyleNameLabel}
              onChange={(event) => {
                onFieldChange("customStyle", {
                  name: event.currentTarget.value,
                  instruction: settings.customStyle?.instruction ?? "",
                  isValid:
                    Boolean(event.currentTarget.value.trim()) &&
                    Boolean(settings.customStyle?.instruction.trim())
                });
              }}
              type="text"
              value={settings.customStyle?.name ?? ""}
            />
          </label>
          <label>
            {en.options.customStyleInstructionLabel}
            <textarea
              aria-label={en.options.customStyleInstructionLabel}
              onChange={(event) => {
                onFieldChange("customStyle", {
                  name: settings.customStyle?.name ?? "Custom style",
                  instruction: event.currentTarget.value,
                  isValid:
                    Boolean(settings.customStyle?.name?.trim()) &&
                    Boolean(event.currentTarget.value.trim())
                });
              }}
              value={settings.customStyle?.instruction ?? ""}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
