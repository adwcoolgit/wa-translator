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
    const incomingMode = screen.getByRole("combobox", { name: /incoming messages/i });

    enableToggle.focus();
    expect(document.activeElement).toBe(enableToggle);

    targetLanguage.focus();
    expect(document.activeElement).toBe(targetLanguage);

    incomingMode.focus();
    expect(document.activeElement).toBe(incomingMode);
  });

  it("keeps options navigation and save actions focusable by keyboard", () => {
    render(
      <OptionsApp
        activeSection="translation"
        draftSettings={defaultUserSettings}
        onCancel={vi.fn()}
        onFieldChange={vi.fn()}
        onSave={vi.fn()}
        onSectionChange={vi.fn()}
        providerHealth={createUnknownProviderHealth("codex")}
        saveState="dirty"
        shortcutStatus={createDefaultShortcutStatusModel()}
        validationMessages={{}}
      />
    );

    const navigationButton = screen.getByRole("button", { name: /translation/i });
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    navigationButton.focus();
    expect(document.activeElement).toBe(navigationButton);

    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);
  });
});
