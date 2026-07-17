import React, { startTransition, useEffect, useEffectEvent, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { CompanionLifecycleService } from "../background/companionLifecycleService";
import { createUnknownProviderHealth, type ProviderHealth } from "../domain/provider/providerHealth";
import {
  buildShortcutStatusModel,
  buildValidationMessages,
  createDefaultShortcutStatusModel,
  type OptionsSectionId,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import { createSettingsRepository } from "../domain/settings/settingsRepository";
import { createDefaultUserSettings, normalizeUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { OptionsApp } from "./OptionsApp";
import { parseOptionsSectionFromHash } from "./optionsSectionRouting";

const settingsRepository = createSettingsRepository();
const companionLifecycleService = new CompanionLifecycleService();

const loadShortcutStatus = async (): Promise<ShortcutStatusModel> =>
  await new Promise<ShortcutStatusModel>((resolve) => {
    if (typeof chrome === "undefined" || !chrome.commands?.getAll) {
      resolve(createDefaultShortcutStatusModel());
      return;
    }

    chrome.commands.getAll((commands) => {
      resolve(buildShortcutStatusModel(commands));
    });
  });

function App() {
  const [settings, setSettings] = useState<UserSettings>(() => createDefaultUserSettings());
  const [draftSettings, setDraftSettings] = useState<UserSettings>(() => createDefaultUserSettings());
  const [providerHealth, setProviderHealth] = useState<ProviderHealth>(() =>
    createUnknownProviderHealth(createDefaultUserSettings().providerActive)
  );
  const [shortcutStatus, setShortcutStatus] = useState<ShortcutStatusModel>(() =>
    createDefaultShortcutStatusModel()
  );
  const [activeSection, setActiveSection] = useState<OptionsSectionId>(() =>
    typeof window === "undefined" ? "translation" : parseOptionsSectionFromHash(window.location.hash)
  );
  const [saveState, setSaveState] = useState<
    "clean" | "dirty" | "saving" | "saved" | "validationError" | "saveFailed"
  >("clean");

  const validationMessages = useMemo(
    () => buildValidationMessages(draftSettings),
    [draftSettings]
  );

  const initialize = useEffectEvent(async () => {
    const loadedSettings = await settingsRepository.initialize();
    const [nextProviderHealth, nextShortcutStatus] = await Promise.all([
      companionLifecycleService.runSyntheticProviderHealthCheck(loadedSettings.providerActive, loadedSettings),
      loadShortcutStatus()
    ]);

    startTransition(() => {
      setSettings(loadedSettings);
      setDraftSettings(loadedSettings);
      setProviderHealth(nextProviderHealth);
      setShortcutStatus(nextShortcutStatus);
      setSaveState("clean");
    });
  });

  const saveSettings = useEffectEvent(async () => {
    const normalized = normalizeUserSettings(draftSettings);
    const validation = buildValidationMessages(normalized);
    if (Object.keys(validation).length > 0) {
      startTransition(() => {
        setSaveState("validationError");
      });
      return;
    }

    startTransition(() => {
      setSaveState("saving");
    });

    try {
      const nextSettings = await settingsRepository.save(normalized);
      const nextProviderHealth = await companionLifecycleService.runSyntheticProviderHealthCheck(
        nextSettings.providerActive,
        nextSettings
      );

      startTransition(() => {
        setSettings(nextSettings);
        setDraftSettings(nextSettings);
        setProviderHealth(nextProviderHealth);
        setSaveState("saved");
      });
    } catch {
      startTransition(() => {
        setSaveState("saveFailed");
      });
    }
  });

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHashChange = (): void => {
      setActiveSection(parseOptionsSectionFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (saveState !== "dirty") {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveState]);

  return (
    <OptionsApp
      activeSection={activeSection}
      draftSettings={draftSettings}
      onCancel={() => {
        startTransition(() => {
          setDraftSettings(settings);
          setSaveState("clean");
        });
      }}
      onFieldChange={(field, value) => {
        startTransition(() => {
          setDraftSettings((current) => ({
            ...current,
            [field]: value
          }));
          setSaveState("dirty");
        });
      }}
      onOpenShortcutSettings={() => {
        window.open("chrome://extensions/shortcuts", "_blank", "noopener,noreferrer");
      }}
      onSave={() => {
        void saveSettings();
      }}
      onSectionChange={(section) => {
        startTransition(() => {
          setActiveSection(section);
        });
        window.location.hash = section;
      }}
      providerHealth={providerHealth}
      saveState={saveState}
      shortcutStatus={shortcutStatus}
      validationMessages={validationMessages}
    />
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}