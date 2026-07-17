// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { defaultUserSettings } from "../../../src/domain/settings/userSettings";
import { PopupApp } from "../../../src/popup/PopupApp";

describe("PopupApp", () => {
  it("blocks daily translation controls until onboarding is complete", () => {
    render(
      <PopupApp
        loading={false}
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

    expect(screen.getByRole("heading", { name: /setup belum selesai/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume onboarding/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /daily controls/i })).not.toBeInTheDocument();
  });
});
