import React, { startTransition, useEffect, useEffectEvent, useState } from "react";
import { createRoot } from "react-dom/client";

import { createSettingsRepository } from "../domain/settings/settingsRepository";
import { createDefaultUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { PopupApp } from "./PopupApp";

const settingsRepository = createSettingsRepository();

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

  const loadSettings = useEffectEvent(async () => {
    const loadedSettings = await settingsRepository.initialize();
    syncState(loadedSettings, setSettings, setLoading);
  });

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return <PopupApp loading={loading} settings={settings} />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
