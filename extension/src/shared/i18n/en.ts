export const en = {
  appName: "WA Translator",
  common: {
    actions: {
      back: "Back",
      cancel: "Cancel",
      close: "Close",
      continue: "Continue",
      copy: "Copy",
      dismiss: "Dismiss",
      finishSetup: "Finish setup",
      openDiagnostics: "Open diagnostics",
      openSettings: "Open settings",
      replaceSelection: "Replace selection",
      replaceComposer: "Replace composer",
      insertAtCaret: "Insert at caret",
      insertIntoComposer: "Insert into composer",
      resumeOnboarding: "Resume onboarding",
      retry: "Retry",
      returnToChat: "Return to chat",
      save: "Save changes",
      undo: "Undo"
    },
    stateBadges: {
      attention: "Needs attention",
      blocked: "Blocked",
      diagnostics: "Diagnostics available",
      ready: "Ready",
      safeProfile: "Safe profile",
      setupRequired: "Setup required"
    },
    startupBehaviors: {
      restoreLastEnabled: "Restore the last enabled state on browser restart",
      startDisabled: "Start disabled until enabled again"
    }
  },
  languages: {
    auto: "Auto detect",
    id: "Indonesian",
    en: "English",
    ms: "Malay",
    "zh-CN": "Mandarin (Simplified)",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    es: "Spanish"
  },
  styles: {
    neutral: "Neutral",
    formal: "Formal",
    casual: "Casual",
    friendly: "Friendly",
    professional: "Professional",
    concise: "Concise",
    polite: "Polite",
    custom: "Custom"
  },
  incomingModes: {
    inline: "Inline",
    tooltip: "Tooltip",
    onDemand: "On demand",
    off: "Off"
  },
  popup: {
    loading: "Loading WA Translator settings...",
    setupPendingTitle: "Setup not complete",
    setupPendingBody:
      "Translation stays blocked until privacy disclosure, the local companion, and the synthetic provider health check are complete.",
    dailyControlsTitle: "Daily controls",
    enableLabel: "Enable WA Translator",
    providerLabel: "Provider",
    targetLanguageLabel: "Translate to",
    sourceLanguageLabel: "Source language",
    styleLabel: "Style",
    incomingModeLabel: "Incoming messages",
    manualShortcutLabel: "Manual translate shortcut",
    manualActionLabel: "Manual translate",
    manualShortcutHelp:
      "Use the shortcut from WhatsApp Web to translate the current selection or active composer safely.",
    providerReadySummary: "Provider is ready for translation requests.",
    providerAttentionSummary: "Provider needs attention before translation can continue safely.",
    privacyLabel: "Privacy",
    diagnosticsLabel: "Diagnostics",
    openSettings: "Open settings",
    resumeOnboarding: "Resume onboarding",
    diagnosticsHint: "Diagnostics and recovery details are available in Settings."
  },
  options: {
    title: "WA Translator settings",
    subtitle:
      "Daily language and display controls stay fast in the popup. Provider, privacy, and support settings stay here.",
    sections: {
      general: "General",
      translation: "Translation",
      styles: "Styles",
      provider: "AI Provider",
      shortcuts: "Shortcuts",
      privacy: "Privacy",
      diagnostics: "Diagnostics",
      advanced: "Advanced"
    },
    groups: {
      basic: "Basic",
      system: "System",
      support: "Support"
    },
    save: "Save changes",
    cancel: "Cancel",
    dirty: "Unsaved changes",
    saving: "Saving settings...",
    saved: "Settings saved.",
    validationError: "Fix the highlighted settings before saving.",
    saveFailed: "Settings could not be saved. Try again.",
    dirtySummary: "There are unsaved settings on this page.",
    generalDescription: "Choose the interface language used by extension surfaces.",
    translationDescription:
      "Control source detection, target language, incoming display mode, and manual behavior.",
    stylesDescription:
      "Choose the tone profile applied to new translation requests. Existing requests keep their own snapshot.",
    providerDescription:
      "Provider setup stays separate from popup quick controls and uses explicit save behavior.",
    privacyDescription:
      "Operational preferences remain content-free and must never persist source or translated text.",
    diagnosticsDescription:
      "Diagnostics stay redacted and content-free. Export and recovery actions will be extended in the next phase.",
    shortcutDescription:
      "Chrome manages the final shortcut assignment. The extension can only report the current binding state.",
    lifecycleLabel: "Companion status",
    providerStatusLabel: "Provider health",
    telemetryLabel: "Allow opt-in telemetry",
    sessionCacheLabel: "Enable session-only translation cache",
    sessionCacheTtlLabel: "Session cache TTL (minutes)",
    providerTimeoutLabel: "Provider timeout (seconds)",
    providerConcurrencyLabel: "Provider concurrency",
    queueMaxPendingLabel: "Queue max pending",
    undoSecondsLabel: "Undo window (seconds)",
    startupBehaviorLabel: "Startup behavior",
    startupBehaviorHelp: "Choose whether WA Translator restores the last enabled state when Chrome starts again.",
    setupStatusLabel: "Setup status",
    recentTargetLanguagesLabel: "Recent target languages",
    recentTargetLanguagesEmpty: "No recent target languages yet.",
    recentTargetLanguagesHelp: "Recently used languages stay limited to the MVP language set.",
    providerSelectLabel: "Active provider",
    providerProfileLabel: "Provider profile label",
    autoDetectedPathLabel: "Auto-detected executable",
    manualOverrideLabel: "Manual override path",
    safeProfileLabel: "Safe execution profile",
    validationActionsLabel: "Validation and recovery",
    customStyleNameLabel: "Custom style name",
    customStyleInstructionLabel: "Custom style instruction",
    diagnosticsPlaceholder:
      "Diagnostics export and reset actions land in Phase 7. This page stays content-free in the meantime.",
    privacyPromise:
      "WA Translator does not persist source or translated message text to extension storage.",
    openChromeShortcuts: "Open Chrome shortcut settings",
    destructiveActionHeading: "Local data actions",
    clearLocalDataLabel: "Clear local data",
    resetSettingsLabel: "Reset settings",
    clearLocalDataImpact:
      "Clears session-only cache and diagnostics without changing saved defaults.",
    resetSettingsImpact:
      "Resets saved settings to safe defaults and clears session-only operational data.",
    advancedHidden: "Advanced post-MVP controls remain hidden in the MVP UI."
  },
  providerStates: {
    unknown: "Status pending",
    checking: "Checking provider health",
    ready: "Ready",
    missing: "Companion or provider missing",
    authRequired: "CLI sign-in required",
    timeout: "Timed out",
    rateLimited: "Usage limited",
    invalidOutput: "Invalid provider output",
    unsafeConfiguration: "Unsafe configuration",
    versionMismatch: "Version mismatch",
    unavailable: "Unavailable"
  },
  shortcuts: {
    assigned: "Shortcut assigned",
    unassigned: "Shortcut not assigned",
    conflict: "Shortcut conflict detected",
    fallback: "Use Chrome shortcut settings to assign or fix the manual translate command."
  }
} as const;
