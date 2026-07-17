// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createUnknownProviderHealth } from "../../../src/domain/provider/providerHealth";
import { defaultUserSettings } from "../../../src/domain/settings/userSettings";
import { PopupApp } from "../../../src/popup/PopupApp";

describe("PopupApp daily controls", () => {
  it("renders popup controls and forwards quick setting changes", () => {
    const onToggleEnabled = vi.fn();
    const onTargetLanguageChange = vi.fn();
    const onStyleChange = vi.fn();
    const onIncomingModeChange = vi.fn();

    render(
      <PopupApp
        loading={false}
        onIncomingModeChange={onIncomingModeChange}
        onStyleChange={onStyleChange}
        onTargetLanguageChange={onTargetLanguageChange}
        onToggleEnabled={onToggleEnabled}
        providerHealth={createUnknownProviderHealth("codex")}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "complete",
          onboardingProgress: {
            currentStep: "ready",
            consentAccepted: true
          },
          styleId: "professional",
          targetLanguage: "en"
        }}
        shortcutStatus={{
          commandName: "manual-translate-selection",
          shortcut: "Ctrl+Shift+Y",
          state: "assigned",
          summary: "Shortcut assigned",
          details: "Ctrl+Shift+Y is assigned to the manual translate command."
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /daily controls/i })).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\+Shift\+Y is assigned/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /enable wa translator/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /translate to/i }), {
      target: { value: "ja" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /style/i }), {
      target: { value: "formal" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /incoming messages/i }), {
      target: { value: "tooltip" }
    });

    expect(onToggleEnabled).toHaveBeenCalledWith(false);
    expect(onTargetLanguageChange).toHaveBeenCalledWith("ja");
    expect(onStyleChange).toHaveBeenCalledWith("formal");
    expect(onIncomingModeChange).toHaveBeenCalledWith("tooltip");
    expect(screen.queryByRole("option", { name: "Custom" })).not.toBeInTheDocument();
  });

  it("shows the saved incoming mode during setup gating", () => {
    render(
      <PopupApp
        loading={false}
        providerHealth={createUnknownProviderHealth("claude")}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "inProgress",
          incomingMode: "tooltip"
        }}
      />
    );

    expect(screen.getByText("Tooltip")).toBeInTheDocument();
    expect(screen.queryByText(/status pending/i)).not.toBeInTheDocument();
  });

  it("shows safe shortcut fallback when no shortcut is assigned", () => {
    render(
      <PopupApp
        loading={false}
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

    expect(screen.getAllByText(/shortcut not assigned/i)).toHaveLength(2);
    expect(screen.getByText(/use the shortcut from whatsapp web/i)).toBeInTheDocument();
  });
});