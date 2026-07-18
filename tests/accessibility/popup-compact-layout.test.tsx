// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createUnknownProviderHealth } from "../../extension/src/domain/provider/providerHealth";
import { defaultUserSettings } from "../../extension/src/domain/settings/userSettings";
import { PopupApp } from "../../extension/src/popup/PopupApp";
import { renderSurface } from "../../extension/tests/component/testUtils/surfaceRender";

describe("popup compact layout accessibility", () => {
  it("keeps the compact daily-control regions reachable in the popup landmark", () => {
    renderSurface(
      <PopupApp
        loading={false}
        onIncomingModeChange={vi.fn()}
        onManualTranslate={vi.fn()}
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
      />,
      {
        hostAttributes: {
          "data-viewport": "popup-compact"
        }
      }
    );

    expect(screen.getAllByRole("heading", { name: /daily controls/i })).toHaveLength(2);
    expect(screen.getByRole("button", { name: /translate current selection/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open settings/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /inline/i })).toHaveAttribute("aria-checked", "true");
  });

  it("supports keyboard navigation inside the incoming mode radiogroup", () => {
    const onIncomingModeChange = vi.fn();

    renderSurface(
      <PopupApp
        loading={false}
        onIncomingModeChange={onIncomingModeChange}
        onManualTranslate={vi.fn()}
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

    const inlineMode = screen.getByRole("radio", { name: /inline/i });
    inlineMode.focus();
    fireEvent.keyDown(inlineMode, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("radio", { name: /tooltip/i }), { key: "End" });

    expect(onIncomingModeChange).toHaveBeenNthCalledWith(1, "tooltip");
    expect(onIncomingModeChange).toHaveBeenNthCalledWith(2, "off");
  });
});
