import React from "react";

import {
  alignProviderHealthToProvider,
  createUnknownProviderHealth,
  type ProviderHealth
} from "../domain/provider/providerHealth";
import {
  buildPopupState,
  createDefaultShortcutStatusModel,
  getPopupProviderSummary,
  type PopupSetupState,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import { type UserSettings } from "../domain/settings/userSettings";
import { SurfacePanel } from "../shared/components/SurfacePanel";
import { en } from "../shared/i18n/en";
import { IncomingModeSelector } from "./components/IncomingModeSelector";
import { LanguageStyleControls } from "./components/LanguageStyleControls";
import { ManualActionRow } from "./components/ManualActionRow";
import { PopupFooter } from "./components/PopupFooter";
import { PopupHeader } from "./components/PopupHeader";

const getSetupDescription = (setupState: PopupSetupState): string =>
  setupState === "blocked" ? en.popup.blockedBody : en.popup.setupPendingBody;

export interface PopupAppProps {
  loading: boolean;
  settings: UserSettings;
  providerHealth?: ProviderHealth;
  shortcutStatus?: ShortcutStatusModel;
  onToggleEnabled?: (value: boolean) => void;
  onTargetLanguageChange?: (value: UserSettings["targetLanguage"]) => void;
  onStyleChange?: (value: UserSettings["styleId"]) => void;
  onIncomingModeChange?: (value: UserSettings["incomingMode"]) => void;
  onManualTranslate?: () => void;
  onOpenSettings?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDiagnostics?: () => void;
  onResumeOnboarding?: () => void;
  manualActionMessage?: string | null;
}

export function PopupApp({
  loading,
  settings,
  providerHealth = createUnknownProviderHealth(settings.providerActive),
  shortcutStatus = createDefaultShortcutStatusModel(),
  onToggleEnabled,
  onTargetLanguageChange,
  onStyleChange,
  onIncomingModeChange,
  onManualTranslate,
  onOpenSettings,
  onOpenPrivacy,
  onOpenDiagnostics,
  onResumeOnboarding,
  manualActionMessage = null
}: PopupAppProps) {
  if (loading) {
    return <main data-surface="popup">{en.popup.loading}</main>;
  }

  const alignedProviderHealth = alignProviderHealthToProvider(settings.providerActive, providerHealth);
  const popupState = buildPopupState({
    settings,
    providerHealth: alignedProviderHealth,
    shortcutStatus
  });
  const setupState = popupState.setupState ?? "ready";
  const controlsDisabled = setupState !== "ready" || !settings.enabled;
  const diagnosticsVisible = popupState.footerLinks?.some((link) => link.id === "diagnostics") ?? false;
  const privacyVisible = popupState.footerLinks?.some((link) => link.id === "privacy") ?? false;
  const showSetupCallout = setupState !== "ready";
  const showPausedCallout = setupState === "ready" && !settings.enabled;
  const showProviderAttention = !showSetupCallout && settings.enabled && popupState.diagnosticsAttentionRequired;
  const manualDisabledReason = showSetupCallout
    ? en.popup.manualActionDisabledSetup
    : !settings.enabled
      ? en.popup.manualActionDisabledPaused
      : null;

  return (
    <main className="popup-shell" data-surface="popup">
      <PopupHeader
        enabled={settings.enabled}
        onToggleEnabled={onToggleEnabled}
        providerHealth={alignedProviderHealth}
        toggleDisabled={setupState !== "ready"}
      />

      {showSetupCallout ? (
        <SurfacePanel
          badges={popupState.stateBadges}
          dataSurface="popup-setup-callout"
          description={getSetupDescription(setupState)}
          headingLevel={2}
          title={en.popup.setupPendingTitle}
          tone="compact"
        />
      ) : null}

      {showPausedCallout ? (
        <SurfacePanel
          badges={popupState.stateBadges}
          dataSurface="popup-paused-callout"
          description={en.popup.pausedBody}
          headingLevel={2}
          title={en.popup.pausedTitle}
          tone="compact"
        />
      ) : null}

      {showProviderAttention ? (
        <SurfacePanel
          badges={popupState.stateBadges}
          dataSurface="popup-provider-callout"
          description={`${en.popup.providerNeedsAttentionBody} ${getPopupProviderSummary(popupState.providerStatus)}`}
          headingLevel={2}
          title={en.popup.providerNeedsAttentionTitle}
          tone="compact"
        />
      ) : null}

      <section aria-labelledby="popup-controls-title">
        <h2 id="popup-controls-title">{en.popup.dailyControlsTitle}</h2>
        <LanguageStyleControls
          allowCustomStyle={settings.customStyle !== null}
          disabled={controlsDisabled}
          onStyleChange={(value) => {
            onStyleChange?.(value);
          }}
          onTargetLanguageChange={(value) => {
            onTargetLanguageChange?.(value);
          }}
          recentTargetLanguages={popupState.recentTargetLanguages}
          styleId={settings.styleId}
          targetLanguage={settings.targetLanguage}
        />

        <IncomingModeSelector
          disabled={controlsDisabled}
          onChange={(value) => {
            onIncomingModeChange?.(value);
          }}
          value={settings.incomingMode}
        />
      </section>

      <ManualActionRow
        disabled={popupState.manualActionAvailable === false}
        disabledReason={manualDisabledReason}
        message={manualActionMessage}
        onAction={onManualTranslate}
        shortcutStatus={shortcutStatus}
      />

      {diagnosticsVisible ? <p>{en.popup.diagnosticsHint}</p> : null}

      <PopupFooter
        onOpenDiagnostics={onOpenDiagnostics}
        onOpenPrivacy={onOpenPrivacy}
        onOpenSettings={onOpenSettings}
        onResumeOnboarding={onResumeOnboarding}
        setupState={setupState}
        showDiagnostics={diagnosticsVisible}
        showPrivacy={privacyVisible}
        showResumeOnboarding={showSetupCallout}
      />
    </main>
  );
}
