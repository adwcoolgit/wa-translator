import React from "react";

import type { ProviderHealth } from "../domain/provider/providerHealth";
import type { LocalDataActionId } from "../domain/settings/localDataActions";
import {
  buildOptionsState,
  getSaveStateMessage,
  type OptionsSectionId,
  type SettingsValidationMessages,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import type { UserSettings } from "../domain/settings/userSettings";
import type { OptionsSaveState } from "../shared/contracts/uiState";
import { isAdvancedSettingsVisible } from "../shared/featureFlags/mvpFeatureFlags";
import { en } from "../shared/i18n/en";
import { DestructiveActionDialog } from "./components/DestructiveActionDialog";
import { ShortcutStatus } from "./components/ShortcutStatus";
import { GeneralSettingsPage } from "./pages/GeneralSettingsPage";
import { PrivacyDiagnosticsPage } from "./pages/PrivacyDiagnosticsPage";
import { ProviderSettingsPage } from "./pages/ProviderSettingsPage";
import { StyleSettingsPage } from "./pages/StyleSettingsPage";
import { TranslationSettingsPage } from "./pages/TranslationSettingsPage";
import { AdvancedSettingsPage } from "./pages/AdvancedSettingsPage";

export interface OptionsAppProps {
  savedSettings: UserSettings;
  draftSettings: UserSettings;
  providerHealth: ProviderHealth;
  saveState: OptionsSaveState;
  activeSection: OptionsSectionId;
  shortcutStatus: ShortcutStatusModel;
  validationMessages: SettingsValidationMessages;
  diagnosticsPreview: string | null;
  diagnosticsStatusMessage: string | null;
  localDataStatusMessage: string | null;
  destructiveActionPending: LocalDataActionId | null;
  onFieldChange: <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => void;
  onSectionChange: (section: OptionsSectionId) => void;
  onSave: () => void;
  onCancel: () => void;
  onResumeOnboarding?: () => void;
  onOpenShortcutSettings?: () => void;
  onPrepareDiagnosticsExport?: () => void;
  onDownloadDiagnosticsExport?: () => void;
  onRequestDestructiveAction?: (actionId: LocalDataActionId) => void;
  onConfirmDestructiveAction?: () => void;
  onCancelDestructiveAction?: () => void;
  onRunProviderHealthCheck?: () => void;
}

const editableSections: OptionsSectionId[] = [
  "general",
  "translation",
  "styles",
  "provider",
  "privacy"
];

const groupedSections: { id: "basic" | "system" | "support"; heading: string; sections: OptionsSectionId[] }[] = [
  {
    id: "basic",
    heading: en.options.groups.basic,
    sections: ["general", "translation", "styles"]
  },
  {
    id: "system",
    heading: en.options.groups.system,
    sections: ["provider", "shortcuts", "privacy"]
  },
  {
    id: "support",
    heading: en.options.groups.support,
    sections: ["diagnostics", ...(isAdvancedSettingsVisible() ? (["advanced"] as OptionsSectionId[]) : [])]
  }
];

export function OptionsApp({
  savedSettings,
  draftSettings,
  providerHealth,
  saveState,
  activeSection,
  shortcutStatus,
  validationMessages,
  diagnosticsPreview,
  diagnosticsStatusMessage,
  localDataStatusMessage,
  destructiveActionPending,
  onFieldChange,
  onSectionChange,
  onSave,
  onCancel,
  onResumeOnboarding,
  onOpenShortcutSettings,
  onPrepareDiagnosticsExport,
  onDownloadDiagnosticsExport,
  onRequestDestructiveAction,
  onConfirmDestructiveAction,
  onCancelDestructiveAction,
  onRunProviderHealthCheck
}: OptionsAppProps) {
  const optionsState = buildOptionsState({
    activeSection,
    saveState,
    validationMessages,
    telemetryEnabled: draftSettings.telemetryEnabled,
    shortcutStatus,
    savedSettings,
    draftSettings,
    recentTargetLanguages: draftSettings.recentTargetLanguages,
    destructiveActionPending
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
          {groupedSections.map((group) => (
            <section key={group.id}>
              <h2>{group.heading}</h2>
              <ul>
                {group.sections.map((sectionId) => (
                  <li key={sectionId}>
                    <button
                      aria-current={sectionId === activeSection ? "page" : undefined}
                      onClick={() => {
                        onSectionChange(sectionId);
                      }}
                      type="button"
                    >
                      {en.options.sections[sectionId]}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <section className="options-content">
          {activeSection === "general" ? (
            <GeneralSettingsPage
              localDataStatusMessage={localDataStatusMessage}
              onFieldChange={onFieldChange}
              onRequestDestructiveAction={onRequestDestructiveAction}
              onResumeOnboarding={onResumeOnboarding}
              settings={draftSettings}
              validationMessages={validationMessages}
            />
          ) : null}

          {activeSection === "translation" ? (
            <TranslationSettingsPage
              onFieldChange={onFieldChange}
              settings={draftSettings}
              validationMessages={validationMessages}
            />
          ) : null}

          {activeSection === "styles" ? (
            <StyleSettingsPage onFieldChange={onFieldChange} settings={draftSettings} />
          ) : null}

          {activeSection === "provider" ? (
            <ProviderSettingsPage
              onFieldChange={onFieldChange}
              onRunHealthCheck={onRunProviderHealthCheck}
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
              diagnosticsPreview={diagnosticsPreview}
              diagnosticsStatusMessage={diagnosticsStatusMessage}
              onDownloadDiagnosticsExport={onDownloadDiagnosticsExport}
              onFieldChange={onFieldChange}
              onPrepareDiagnosticsExport={onPrepareDiagnosticsExport}
              providerHealth={providerHealth}
              settings={draftSettings}
              shortcutStatus={shortcutStatus}
              validationMessages={validationMessages}
            />
          ) : null}

          {activeSection === "advanced" && isAdvancedSettingsVisible() ? <AdvancedSettingsPage /> : null}

          <footer className="options-footer">
            {saveStateMessage ? <p role="status">{saveStateMessage}</p> : null}
            {optionsState.hasUnsavedChanges ? (
              <p>{optionsState.changedFieldCount} setting field(s) pending save on this page.</p>
            ) : null}
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

      {destructiveActionPending ? (
        <DestructiveActionDialog
          actionId={destructiveActionPending}
          onCancel={() => {
            onCancelDestructiveAction?.();
          }}
          onConfirm={() => {
            onConfirmDestructiveAction?.();
          }}
        />
      ) : null}
    </main>
  );
}

