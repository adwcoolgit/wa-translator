import React, { startTransition, useEffect, useEffectEvent, useState } from "react";
import { createRoot } from "react-dom/client";

import { CompanionLifecycleService } from "../background/companionLifecycleService";
import { createUnknownProviderHealth, type ProviderHealth } from "../domain/provider/providerHealth";
import {
  createDefaultShortcutStatusModel,
  createPartialSettingsPatch,
  type ShortcutStatusModel
} from "../domain/settings/settingsViewModel";
import { createSettingsRepository } from "../domain/settings/settingsRepository";
import { createDefaultUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { en } from "../shared/i18n/en";
import { PopupApp } from "./PopupApp";
import {
  loadShortcutStatus,
  openOnboardingPage,
  openOptionsPage,
  triggerManualTranslationFromPopup
} from "./popupActions";

const settingsRepository = createSettingsRepository();
const companionLifecycleService = new CompanionLifecycleService();

const syncState = (
  settings: UserSettings,
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  startTransition(() => {
    setSettings(settings);
    setLoading(false);
  });
};

function App() {
  const [settings, setSettings] = useState<UserSettings>(() => createDefaultUserSettings());
  const [loading, setLoading] = useState(true);
  const [providerHealth, setProviderHealth] = useState<ProviderHealth>(() =>
    createUnknownProviderHealth(createDefaultUserSettings().providerActive)
  );
  const [shortcutStatus, setShortcutStatus] = useState<ShortcutStatusModel>(() =>
    createDefaultShortcutStatusModel()
  );
  const [manualActionMessage, setManualActionMessage] = useState<string | null>(null);

  const loadSettings = useEffectEvent(async () => {
    const loadedSettings = await settingsRepository.initialize();
    syncState(loadedSettings, setSettings, setLoading);

    const [nextShortcutStatus, nextProviderHealth] = await Promise.all([
      loadShortcutStatus(),
      companionLifecycleService.runSyntheticProviderHealthCheck(loadedSettings.providerActive, loadedSettings)
    ]);

    startTransition(() => {
      setShortcutStatus(nextShortcutStatus);
      setProviderHealth(nextProviderHealth);
    });
  });

  const saveQuickSetting = useEffectEvent(async (update: Partial<UserSettings>) => {
    const nextSettings = await settingsRepository.save(createPartialSettingsPatch(settings, update));
    startTransition(() => {
      setSettings(nextSettings);
    });
  });

  const handleManualTranslate = useEffectEvent(async () => {
    const result = await triggerManualTranslationFromPopup();
    startTransition(() => {
      setManualActionMessage(result === "sent" ? null : en.popup.manualActionUnsupportedContext);
    });
  });

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <PopupApp
      loading={loading}
      manualActionMessage={manualActionMessage}
      onIncomingModeChange={(value) => {
        void saveQuickSetting({ incomingMode: value });
      }}
      onManualTranslate={() => {
        void handleManualTranslate();
      }}
      onOpenDiagnostics={() => {
        void openOptionsPage("diagnostics");
      }}
      onOpenPrivacy={() => {
        void openOptionsPage("privacy");
      }}
      onOpenSettings={() => {
        void openOptionsPage();
      }}
      onResumeOnboarding={() => {
        void openOnboardingPage();
      }}
      onStyleChange={(value) => {
        void saveQuickSetting({
          styleId: value,
          customStyle: settings.customStyle
        });
      }}
      onTargetLanguageChange={(value) => {
        void saveQuickSetting({ targetLanguage: value });
      }}
      onToggleEnabled={(value) => {
        void saveQuickSetting({ enabled: value });
      }}
      providerHealth={providerHealth}
      settings={settings}
      shortcutStatus={shortcutStatus}
    />
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
