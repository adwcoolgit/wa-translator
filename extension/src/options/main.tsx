import React, { startTransition, useEffect, useEffectEvent, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { CompanionLifecycleService } from "../background/companionLifecycleService";
import { createDiagnosticsExportService } from "../diagnostics/diagnosticsExportService";
import { createRecoveryDiagnosticsRecorder } from "../diagnostics/recoveryDiagnostics";
import { createUnknownProviderHealth, type ProviderHealth } from "../domain/provider/providerHealth";
import {
  createLocalDataActions,
  type LocalDataActionId
} from "../domain/settings/localDataActions";
import {
  buildShortcutStatusModel,
  buildValidationMessages,
  getProviderHealthValidationMessages,
  createDefaultShortcutStatusModel,
  createPartialSettingsPatch,
  type OptionsSectionId,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import { createSettingsRepository } from "../domain/settings/settingsRepository";
import { createDefaultUserSettings, normalizeUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { OptionsApp } from "./OptionsApp";
import { parseOptionsSectionFromHash } from "./optionsSectionRouting";

const settingsRepository = createSettingsRepository();
const companionLifecycleService = new CompanionLifecycleService();
const diagnosticsExportService = createDiagnosticsExportService();
const localDataActions = createLocalDataActions(settingsRepository);
const recoveryDiagnostics = createRecoveryDiagnosticsRecorder();

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

const openOnboardingPage = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const onboardingUrl = typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("src/onboarding/index.html")
    : "src/onboarding/index.html";

  window.open(onboardingUrl, "_blank", "noopener,noreferrer");
};

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
    typeof window === "undefined" ? "general" : parseOptionsSectionFromHash(window.location.hash)
  );
  const [saveState, setSaveState] = useState<
    "clean" | "dirty" | "saving" | "saved" | "validationError" | "saveFailed"
  >("clean");
  const [diagnosticsPreview, setDiagnosticsPreview] = useState<string | null>(null);
  const [diagnosticsStatusMessage, setDiagnosticsStatusMessage] = useState<string | null>(null);
  const [localDataStatusMessage, setLocalDataStatusMessage] = useState<string | null>(null);
  const [destructiveActionPending, setDestructiveActionPending] = useState<LocalDataActionId | null>(null);

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
      setDestructiveActionPending(null);
    });
  });

  const saveSettings = useEffectEvent(async () => {
    const validation = buildValidationMessages(draftSettings);
    if (Object.keys(validation).length > 0) {
      startTransition(() => {
        setSaveState("validationError");
      });
      return;
    }

    const normalized = normalizeUserSettings(draftSettings);

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

  const runProviderHealthCheck = useEffectEvent(async () => {
    const providerValidation = getProviderHealthValidationMessages(
      buildValidationMessages(draftSettings)
    );
    if (Object.keys(providerValidation).length > 0) {
      startTransition(() => {
        setSaveState("validationError");
      });
      return;
    }

    const nextProviderHealth = await companionLifecycleService.runSyntheticProviderHealthCheck(
      draftSettings.providerActive,
      draftSettings
    );

    startTransition(() => {
      setProviderHealth(nextProviderHealth);
    });
  });

  const confirmDestructiveAction = useEffectEvent(async () => {
    if (!destructiveActionPending) {
      return;
    }

    const result =
      destructiveActionPending === "clearLocalData"
        ? await localDataActions.clearLocalData()
        : await localDataActions.resetSettings();

    if (destructiveActionPending === "clearLocalData") {
      recoveryDiagnostics.recordPrivacyAction("clearLocalData");
      startTransition(() => {
        setDestructiveActionPending(null);
        setLocalDataStatusMessage(result.statusMessage);
      });
      return;
    }

    const nextProviderHealth = await companionLifecycleService.runSyntheticProviderHealthCheck(
      result.settings.providerActive,
      result.settings
    );
    recoveryDiagnostics.recordPrivacyAction("resetSettings");
    startTransition(() => {
      setSettings(result.settings);
      setDraftSettings(result.settings);
      setProviderHealth(nextProviderHealth);
      setSaveState("clean");
      setLocalDataStatusMessage(result.statusMessage);
      setDestructiveActionPending(null);
    });
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
      destructiveActionPending={destructiveActionPending}
      diagnosticsPreview={diagnosticsPreview}
      diagnosticsStatusMessage={diagnosticsStatusMessage}
      draftSettings={draftSettings}
      localDataStatusMessage={localDataStatusMessage}
      onCancel={() => {
        startTransition(() => {
          setDraftSettings(settings);
          setSaveState("clean");
        });
      }}
      onCancelDestructiveAction={() => {
        startTransition(() => {
          setDestructiveActionPending(null);
        });
      }}
      onConfirmDestructiveAction={() => {
        void confirmDestructiveAction();
      }}
      onDownloadDiagnosticsExport={() => {
        if (!diagnosticsPreview || typeof document === "undefined") {
          return;
        }

        const blob = new Blob([diagnosticsPreview], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `wa-translator-diagnostics-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }}
      onFieldChange={(field, value) => {
        startTransition(() => {
          setDraftSettings((current) => ({
            ...current,
            ...createPartialSettingsPatch(current, {
              [field]: value
            } as Partial<UserSettings>)
          }));
          if (field === "providerActive") {
            setProviderHealth(createUnknownProviderHealth(value as UserSettings["providerActive"]));
          }
          setSaveState("dirty");
        });
      }}
      onOpenShortcutSettings={() => {
        window.open("chrome://extensions/shortcuts", "_blank", "noopener,noreferrer");
      }}
      onPrepareDiagnosticsExport={() => {
        void (async () => {
          const lifecycle = await companionLifecycleService.queryLifecycle();
          const nextPreview = diagnosticsExportService.serialize(draftSettings, providerHealth, {
            nativeHostVersion: lifecycle.hostVersion,
            protocolVersion: lifecycle.protocolVersion
          });
          recoveryDiagnostics.recordPrivacyAction("exportDiagnosticsPrepared");
          startTransition(() => {
            setDiagnosticsPreview(nextPreview);
            setDiagnosticsStatusMessage("Diagnostics export prepared for review.");
          });
        })();
      }}
      onRequestDestructiveAction={(actionId) => {
        startTransition(() => {
          setDestructiveActionPending(actionId);
        });
      }}
      onResumeOnboarding={() => {
        openOnboardingPage();
      }}
      onRunProviderHealthCheck={() => {
        void runProviderHealthCheck();
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
      savedSettings={settings}
      shortcutStatus={shortcutStatus}
      validationMessages={validationMessages}
    />
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

