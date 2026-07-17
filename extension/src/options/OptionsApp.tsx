import React from "react";

import type { ProviderHealth } from "../domain/provider/providerHealth";
import {
  buildOptionsState,
  getSaveStateMessage,
  incomingModeOptions,
  optionsSectionGroups,
  sourceLanguageOptions,
  styleOptions,
  type OptionsSectionId,
  type SettingsValidationMessages,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import type { UserSettings } from "../domain/settings/userSettings";
import type { OptionsSaveState } from "../shared/contracts/uiState";
import { isAdvancedSettingsVisible } from "../shared/featureFlags/mvpFeatureFlags";
import { en } from "../shared/i18n/en";
import { ShortcutStatus } from "./components/ShortcutStatus";
import { PrivacyDiagnosticsPage } from "./pages/PrivacyDiagnosticsPage";
import { ProviderSettingsPage } from "./pages/ProviderSettingsPage";

export interface OptionsAppProps {
  draftSettings: UserSettings;
  providerHealth: ProviderHealth;
  saveState: OptionsSaveState;
  activeSection: OptionsSectionId;
  shortcutStatus: ShortcutStatusModel;
  validationMessages: SettingsValidationMessages;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
  onSectionChange: (section: OptionsSectionId) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenShortcutSettings?: () => void;
}

const editableSections: OptionsSectionId[] = [
  "general",
  "translation",
  "styles",
  "provider",
  "privacy"
];

export function OptionsApp({
  draftSettings,
  providerHealth,
  saveState,
  activeSection,
  shortcutStatus,
  validationMessages,
  onFieldChange,
  onSectionChange,
  onSave,
  onCancel,
  onOpenShortcutSettings
}: OptionsAppProps) {
  const optionsState = buildOptionsState({
    activeSection,
    saveState,
    validationMessages,
    telemetryEnabled: draftSettings.telemetryEnabled,
    shortcutStatus
  });
  const saveStateMessage = getSaveStateMessage(optionsState.saveState);
  const isEditableSection = editableSections.includes(activeSection);

  return (
    <main className="options-shell" data-surface="options">
      <header className="options-header">
        <p className="eyebrow">{en.appName}</p>
        <h1>{en.options.title}</h1>
        <p>{en.options.subtitle}</p>
      </header>

      <div className="options-layout">
        <nav aria-label="Settings navigation" className="options-nav">
          {optionsSectionGroups.map((group) => (
            <section key={group.heading}>
              <h2>{group.heading}</h2>
              <ul>
                {group.sections.map((section) => (
                  <li key={section.id}>
                    <button
                      aria-current={section.id === activeSection ? "page" : undefined}
                      onClick={() => {
                        onSectionChange(section.id);
                      }}
                      type="button"
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <section className="options-content">
          {activeSection === "general" ? (
            <section aria-labelledby="general-settings-title">
              <h2 id="general-settings-title">{en.options.sections.general}</h2>
              <p>{en.options.generalDescription}</p>
              <label>
                UI language
                <select
                  aria-label="UI language"
                  onChange={(event) => {
                    onFieldChange("uiLanguage", event.currentTarget.value);
                  }}
                  value={draftSettings.uiLanguage}
                >
                  <option value="id">Indonesian</option>
                  <option value="en">English</option>
                </select>
              </label>
            </section>
          ) : null}

          {activeSection === "translation" ? (
            <section aria-labelledby="translation-settings-title">
              <h2 id="translation-settings-title">{en.options.sections.translation}</h2>
              <p>{en.options.translationDescription}</p>
              <div className="options-field-grid">
                <label>
                  {en.popup.sourceLanguageLabel}
                  <select
                    aria-label={en.popup.sourceLanguageLabel}
                    onChange={(event) => {
                      onFieldChange("sourceLanguage", event.currentTarget.value);
                    }}
                    value={draftSettings.sourceLanguage}
                  >
                    {sourceLanguageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {en.popup.targetLanguageLabel}
                  <select
                    aria-label={en.popup.targetLanguageLabel}
                    onChange={(event) => {
                      onFieldChange("targetLanguage", event.currentTarget.value);
                    }}
                    value={draftSettings.targetLanguage}
                  >
                    {sourceLanguageOptions
                      .filter((option) => option.value !== "auto")
                      .map((option) => (
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
                    value={draftSettings.incomingMode}
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
                    value={draftSettings.manualMode}
                  >
                    <option value="preview">Preview</option>
                    <option value="directReplace">Direct replace</option>
                  </select>
                </label>
              </div>
            </section>
          ) : null}

          {activeSection === "styles" ? (
            <section aria-labelledby="styles-settings-title">
              <h2 id="styles-settings-title">{en.options.sections.styles}</h2>
              <p>{en.options.stylesDescription}</p>
              <div className="options-field-grid">
                <label>
                  {en.popup.styleLabel}
                  <select
                    aria-label={en.popup.styleLabel}
                    onChange={(event) => {
                      const styleId = event.currentTarget.value as UserSettings["styleId"];
                      onFieldChange("styleId", styleId);
                    }}
                    value={draftSettings.styleId}
                  >
                    {styleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {draftSettings.styleId === "custom" ? (
                  <>
                    <label>
                      {en.options.customStyleNameLabel}
                      <input
                        aria-label={en.options.customStyleNameLabel}
                        onChange={(event) => {
                          onFieldChange("customStyle", {
                            name: event.currentTarget.value,
                            instruction: draftSettings.customStyle?.instruction ?? "",
                            isValid:
                              Boolean(event.currentTarget.value.trim()) &&
                              Boolean(draftSettings.customStyle?.instruction.trim())
                          });
                        }}
                        type="text"
                        value={draftSettings.customStyle?.name ?? ""}
                      />
                    </label>
                    <label>
                      {en.options.customStyleInstructionLabel}
                      <textarea
                        aria-label={en.options.customStyleInstructionLabel}
                        onChange={(event) => {
                          onFieldChange("customStyle", {
                            name: draftSettings.customStyle?.name ?? "Custom style",
                            instruction: event.currentTarget.value,
                            isValid:
                              Boolean(draftSettings.customStyle?.name?.trim()) &&
                              Boolean(event.currentTarget.value.trim())
                          });
                        }}
                        value={draftSettings.customStyle?.instruction ?? ""}
                      />
                    </label>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeSection === "provider" ? (
            <ProviderSettingsPage
              onFieldChange={onFieldChange}
              providerHealth={providerHealth}
              settings={draftSettings}
              validationMessages={validationMessages}
            />
          ) : null}

          {activeSection === "shortcuts" ? (
            <ShortcutStatus model={shortcutStatus} onOpenShortcutSettings={onOpenShortcutSettings} />
          ) : null}

          {activeSection === "privacy" || activeSection === "diagnostics" ? (
            <PrivacyDiagnosticsPage
              activeSection={activeSection}
              onFieldChange={onFieldChange}
              providerHealth={providerHealth}
              settings={draftSettings}
              shortcutStatus={shortcutStatus}
              validationMessages={validationMessages}
            />
          ) : null}

          {activeSection === "advanced" && isAdvancedSettingsVisible() ? (
            <PrivacyDiagnosticsPage
              activeSection="advanced"
              onFieldChange={onFieldChange}
              providerHealth={providerHealth}
              settings={draftSettings}
              shortcutStatus={shortcutStatus}
              validationMessages={validationMessages}
            />
          ) : null}

          <footer className="options-footer">
            {saveStateMessage ? <p role="status">{saveStateMessage}</p> : null}
            {isEditableSection ? (
              <div>
                <button
                  disabled={optionsState.saveState === "saving"}
                  onClick={onCancel}
                  type="button"
                >
                  {en.options.cancel}
                </button>
                <button
                  disabled={
                    optionsState.saveState === "saving" ||
                    optionsState.saveState === "clean" ||
                    optionsState.hasBlockingValidation
                  }
                  onClick={onSave}
                  type="button"
                >
                  {en.options.save}
                </button>
              </div>
            ) : null}
          </footer>
        </section>
      </div>
    </main>
  );
}
