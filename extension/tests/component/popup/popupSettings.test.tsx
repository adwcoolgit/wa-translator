// @vitest-environment jsdom
import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createUnknownProviderHealth,
  normalizeProviderHealthState
} from "../../../src/domain/provider/providerHealth";
import { type UserSettings, defaultUserSettings } from "../../../src/domain/settings/userSettings";
import { PopupApp } from "../../../src/popup/PopupApp";

describe("PopupApp daily controls", () => {
  it("renders popup controls, footer affordances, and forwards quick actions", () => {
    const onToggleEnabled = vi.fn();
    const onTargetLanguageChange = vi.fn();
    const onStyleChange = vi.fn();
    const onIncomingModeChange = vi.fn();
    const onManualTranslate = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <PopupApp
        loading={false}
        onIncomingModeChange={onIncomingModeChange}
        onManualTranslate={onManualTranslate}
        onOpenSettings={onOpenSettings}
        onStyleChange={onStyleChange}
        onTargetLanguageChange={onTargetLanguageChange}
        onToggleEnabled={onToggleEnabled}
        providerHealth={normalizeProviderHealthState({
          provider: "codex",
          outcome: "ready",
          latencyMs: 1600
        })}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "complete",
          onboardingProgress: {
            currentStep: "ready",
            consentAccepted: true
          },
          styleId: "professional",
          targetLanguage: "en",
          recentTargetLanguages: ["ja", "en"]
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

    expect(screen.getAllByRole("heading", { name: /daily controls/i })).toHaveLength(2);
    expect(screen.getByLabelText(/provider summary/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /translate current selection/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /open settings/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /enable wa translator/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /translate to/i }), {
      target: { value: "ja" }
    });
    fireEvent.change(screen.getByRole("combobox", { name: /style/i }), {
      target: { value: "formal" }
    });
    fireEvent.click(screen.getByRole("radio", { name: /tooltip/i }));
    fireEvent.click(screen.getByRole("button", { name: /translate current selection/i }));
    fireEvent.click(screen.getByRole("button", { name: /open settings/i }));

    expect(onToggleEnabled).toHaveBeenCalledWith(false);
    expect(onTargetLanguageChange).toHaveBeenCalledWith("ja");
    expect(onStyleChange).toHaveBeenCalledWith("formal");
    expect(onIncomingModeChange).toHaveBeenCalledWith("tooltip");
    expect(onManualTranslate).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("option", { name: "Custom" })).not.toBeInTheDocument();
  });

  it("keeps saved controls stable while provider health refreshes asynchronously", () => {
    function Harness() {
      const [settings, setSettings] = useState<UserSettings>({
        ...defaultUserSettings,
        onboardingStatus: "complete",
        onboardingProgress: {
          currentStep: "ready",
          consentAccepted: true
        },
        targetLanguage: "en"
      });
      const [providerHealth, setProviderHealth] = useState(createUnknownProviderHealth("codex"));

      return (
        <>
          <button
            onClick={() => {
              setProviderHealth(
                normalizeProviderHealthState({
                  provider: "codex",
                  outcome: "ready",
                  latencyMs: 1300
                })
              );
            }}
            type="button"
          >
            Refresh provider
          </button>
          <PopupApp
            loading={false}
            onIncomingModeChange={vi.fn()}
            onStyleChange={vi.fn()}
            onTargetLanguageChange={(value) => {
              setSettings((current) => ({
                ...current,
                targetLanguage: value
              }));
            }}
            onToggleEnabled={vi.fn()}
            providerHealth={providerHealth}
            settings={settings}
          />
        </>
      );
    }

    render(<Harness />);

    const targetLanguage = screen.getByRole("combobox", { name: /translate to/i });
    fireEvent.change(targetLanguage, { target: { value: "ja" } });
    fireEvent.click(screen.getByRole("button", { name: /refresh provider/i }));

    expect(screen.getByRole("combobox", { name: /translate to/i })).toHaveValue("ja");
    expect(screen.getByText(/provider is ready for translation requests/i)).toBeInTheDocument();
  });

  it("shows diagnostics affordances when provider attention is required", () => {
    const onOpenDiagnostics = vi.fn();

    render(
      <PopupApp
        loading={false}
        onOpenDiagnostics={onOpenDiagnostics}
        providerHealth={normalizeProviderHealthState({
          provider: "codex",
          outcome: "timeout",
          latencyMs: 7000
        })}
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

    expect(screen.getByRole("heading", { name: /provider needs attention/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /diagnostics/i }));
    expect(onOpenDiagnostics).toHaveBeenCalledTimes(1);
  });

  it("renders the selected provider summary even when a stale async health update arrives", () => {
    render(
      <PopupApp
        loading={false}
        providerHealth={normalizeProviderHealthState({
          provider: "codex",
          outcome: "ready",
          latencyMs: 900
        })}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "complete",
          onboardingProgress: {
            currentStep: "ready",
            consentAccepted: true
          },
          providerActive: "claude"
        }}
      />
    );

    expect(screen.getByText("CLAUDE")).toBeInTheDocument();
    expect(screen.getByText(/status pending/i)).toBeInTheDocument();
    expect(screen.queryByText(/provider is ready for translation requests/i)).not.toBeInTheDocument();
  });

  it("shows the popup fallback guidance for manual translate when provided", () => {
    render(
      <PopupApp
        loading={false}
        manualActionMessage="Open WhatsApp Web first."
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

    expect(screen.getByText("Open WhatsApp Web first.")).toBeInTheDocument();
    expect(
      screen.queryByText(/runs the same safe manual preview flow as the keyboard shortcut/i)
    ).not.toBeInTheDocument();
  });
});
