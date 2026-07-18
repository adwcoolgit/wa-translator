// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createUnknownProviderHealth } from "../../extension/src/domain/provider/providerHealth";
import { createDefaultShortcutStatusModel } from "../../extension/src/domain/settings/settingsViewModel";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";
import { OptionsApp } from "../../extension/src/options/OptionsApp";
import { PopupApp } from "../../extension/src/popup/PopupApp";

describe("settings keyboard accessibility", () => {
  it("keeps popup controls focusable by keyboard", () => {
    render(
      <PopupApp
        loading={false}
        onIncomingModeChange={vi.fn()}
        onStyleChange={vi.fn()}
        onTargetLanguageChange={vi.fn()}
        onToggleEnabled={vi.fn()}
        providerHealth={createUnknownProviderHealth("codex")}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "complete",
          onboardingProgress: {
            currentStep: "ready",
            consentAccepted: true
          }
        }}
      />
    );

    const enableToggle = screen.getByRole("checkbox", { name: /enable wa translator/i });
    const targetLanguage = screen.getByRole("combobox", { name: /translate to/i });
    const incomingMode = screen.getByRole("radio", { name: /inline/i });

    enableToggle.focus();
    expect(document.activeElement).toBe(enableToggle);

    targetLanguage.focus();
    expect(document.activeElement).toBe(targetLanguage);

    incomingMode.focus();
    expect(document.activeElement).toBe(incomingMode);
  });

  it("keeps options navigation, resume setup, and save actions focusable by keyboard", () => {
    render(
      <OptionsApp
        activeSection="general"
        destructiveActionPending={null}
        draftSettings={defaultUserSettings}
        diagnosticsPreview={null}
        diagnosticsStatusMessage={null}
        localDataStatusMessage={null}
        onCancel={vi.fn()}
        onFieldChange={vi.fn()}
        onRequestDestructiveAction={vi.fn()}
        onResumeOnboarding={vi.fn()}
        onSave={vi.fn()}
        onSectionChange={vi.fn()}
        providerHealth={createUnknownProviderHealth("codex")}
        saveState="dirty"
        savedSettings={defaultUserSettings}
        shortcutStatus={createDefaultShortcutStatusModel()}
        validationMessages={{}}
      />
    );

    const navigationButton = screen.getByRole("button", { name: /general/i });
    const resumeButton = screen.getByRole("button", { name: /resume onboarding/i });
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    navigationButton.focus();
    expect(document.activeElement).toBe(navigationButton);

    resumeButton.focus();
    expect(document.activeElement).toBe(resumeButton);

    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);
  });
});
