export const en = {
  appName: "WA Translator",
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
    manualShortcutHelp:
      "Use the shortcut from WhatsApp Web to translate the current selection or active composer safely.",
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
    providerSelectLabel: "Active provider",
    providerProfileLabel: "Provider profile label",
    customStyleNameLabel: "Custom style name",
    customStyleInstructionLabel: "Custom style instruction",
    diagnosticsPlaceholder:
      "Diagnostics export and reset actions land in Phase 7. This page stays content-free in the meantime.",
    privacyPromise:
      "WA Translator does not persist source or translated message text to extension storage.",
    openChromeShortcuts: "Open Chrome shortcut settings",
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
