import React from "react";

import type { PopupSetupState } from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface PopupFooterProps {
  showPrivacy?: boolean;
  showDiagnostics?: boolean;
  showResumeOnboarding?: boolean;
  setupState?: PopupSetupState;
  onOpenSettings?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDiagnostics?: () => void;
  onResumeOnboarding?: () => void;
}

export function PopupFooter({
  showPrivacy = false,
  showDiagnostics = false,
  showResumeOnboarding = false,
  setupState = "ready",
  onOpenSettings,
  onOpenPrivacy,
  onOpenDiagnostics,
  onResumeOnboarding
}: PopupFooterProps) {
  return (
    <footer className="popup-footer">
      <div>
        <button onClick={onOpenSettings} type="button">
          {en.popup.openSettings}
        </button>
        {showPrivacy ? (
          <button onClick={onOpenPrivacy} type="button">
            {en.popup.privacyLabel}
          </button>
        ) : null}
        {showDiagnostics ? (
          <button onClick={onOpenDiagnostics} type="button">
            {en.popup.diagnosticsLabel}
          </button>
        ) : null}
      </div>

      {showResumeOnboarding && setupState !== "ready" ? (
        <button onClick={onResumeOnboarding} type="button">
          {en.popup.resumeOnboarding}
        </button>
      ) : null}
    </footer>
  );
}
