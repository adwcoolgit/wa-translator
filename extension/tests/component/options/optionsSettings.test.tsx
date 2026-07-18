// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createUnknownProviderHealth } from "../../../src/domain/provider/providerHealth";
import { createDefaultShortcutStatusModel } from "../../../src/domain/settings/settingsViewModel";
import { defaultUserSettings } from "../../../src/domain/settings/userSettings";
import { OptionsApp } from "../../../src/options/OptionsApp";

describe("OptionsApp settings flows", () => {
  it("renders translation settings and saves dirty changes explicitly", () => {
    const onFieldChange = vi.fn();
    const onSave = vi.fn();

    render(
      <OptionsApp
        activeSection="translation"
        destructiveActionPending={null}
        diagnosticsPreview={null}
        diagnosticsStatusMessage={null}
        draftSettings={defaultUserSettings}
        localDataStatusMessage={null}
        onCancel={vi.fn()}
        onFieldChange={onFieldChange}
        onSave={onSave}
        onSectionChange={vi.fn()}
        providerHealth={createUnknownProviderHealth("codex")}
        saveState="dirty"
        savedSettings={defaultUserSettings}
        shortcutStatus={createDefaultShortcutStatusModel()}
        validationMessages={{}}
      />
    );

    fireEvent.change(screen.getByRole("combobox", { name: /translate to/i }), {
      target: { value: "ja" }
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onFieldChange).toHaveBeenCalledWith("targetLanguage", "ja");
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByRole("searchbox", { name: /search target languages/i })).toBeInTheDocument();
  });

  it("renders provider settings with validation-aware save state and support navigation", () => {
    render(
      <OptionsApp
        activeSection="provider"
        destructiveActionPending={null}
        diagnosticsPreview={null}
        diagnosticsStatusMessage={null}
        draftSettings={{
          ...defaultUserSettings,
          providerTimeoutSeconds: 0
        }}
        localDataStatusMessage={null}
        onCancel={vi.fn()}
        onFieldChange={vi.fn()}
        onOpenShortcutSettings={vi.fn()}
        onRunProviderHealthCheck={vi.fn()}
        onSave={vi.fn()}
        onSectionChange={vi.fn()}
        providerHealth={createUnknownProviderHealth("claude")}
        saveState="validationError"
        savedSettings={defaultUserSettings}
        shortcutStatus={createDefaultShortcutStatusModel()}
        validationMessages={{ providerTimeoutSeconds: "Too small" }}
      />
    );

    expect(screen.getByRole("heading", { name: /ai provider/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/fix the highlighted settings before saving/i);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /run synthetic health check/i })).toBeInTheDocument();
  });

  it("keeps destructive actions behind an explicit confirmation dialog", () => {
    const onRequestDestructiveAction = vi.fn();

    render(
      <OptionsApp
        activeSection="general"
        destructiveActionPending={null}
        diagnosticsPreview={null}
        diagnosticsStatusMessage={null}
        draftSettings={defaultUserSettings}
        localDataStatusMessage={null}
        onCancel={vi.fn()}
        onFieldChange={vi.fn()}
        onRequestDestructiveAction={onRequestDestructiveAction}
        onResumeOnboarding={vi.fn()}
        onSave={vi.fn()}
        onSectionChange={vi.fn()}
        providerHealth={createUnknownProviderHealth("codex")}
        saveState="clean"
        savedSettings={defaultUserSettings}
        shortcutStatus={createDefaultShortcutStatusModel()}
        validationMessages={{}}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /clear local data/i }));
    expect(onRequestDestructiveAction).toHaveBeenCalledWith("clearLocalData");
  });
});

