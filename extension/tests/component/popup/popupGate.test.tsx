// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultUserSettings } from "../../../src/domain/settings/userSettings";
import { PopupApp } from "../../../src/popup/PopupApp";

describe("PopupApp gating states", () => {
  it("keeps daily controls visible but disabled until onboarding is complete", () => {
    render(
      <PopupApp
        loading={false}
        onToggleEnabled={vi.fn()}
        settings={{
          ...defaultUserSettings,
          onboardingStatus: "inProgress",
          onboardingProgress: {
            currentStep: "provider",
            consentAccepted: true
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /setup required/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume onboarding/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /enable wa translator/i })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /translate to/i })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /style/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /inline/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /translate current selection/i })).toBeDisabled();
  });

  it("keeps popup controls visible but paused when the extension is disabled", () => {
    render(
      <PopupApp
        loading={false}
        settings={{
          ...defaultUserSettings,
          enabled: false,
          onboardingStatus: "complete",
          onboardingProgress: {
            currentStep: "ready",
            consentAccepted: true
          }
        }}
      />
    );

    expect(screen.getByRole("heading", { name: /translation is paused/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /enable wa translator/i })).not.toBeChecked();
    expect(screen.getByRole("combobox", { name: /translate to/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /translate current selection/i })).toBeDisabled();
  });
});
