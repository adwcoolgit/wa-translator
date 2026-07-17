export const mvpFeatureFlags = {
  showAdvancedSettings: false,
  showPendingIndicatorControls: false,
  showSkipEligibilitySummaries: false,
  showPerChatOverrides: false
} as const;

export const isAdvancedSettingsVisible = (): boolean => mvpFeatureFlags.showAdvancedSettings;
