import type { ProviderHealth } from "../provider/providerHealth";
import { alignProviderHealthToProvider } from "../provider/providerHealth";
import {
  optionsStateSchema,
  popupStateSchema,
  type OptionsSaveState,
  type PopupState,
  type ProviderStatus,
  type StateBadge,
  type StateBadgeTone,
  type SurfaceLink
} from "../../shared/contracts/uiState";
import { isAdvancedSettingsVisible } from "../../shared/featureFlags/mvpFeatureFlags";
import { en } from "../../shared/i18n/en";
import {
  type PartialUserSettings,
  type RecentTargetLanguage,
  recentTargetLanguageSchema,
  userSettingsSchema,
  type UserSettings
} from "./userSettings";

export type SelectOption = {
  value: string;
  label: string;
};

export type ShortcutStatusState = "assigned" | "unassigned" | "conflict";

export type ShortcutStatusModel = {
  commandName: string;
  shortcut: string | null;
  state: ShortcutStatusState;
  summary: string;
  details: string;
};

export type SettingsValidationMessages = Partial<Record<keyof UserSettings | "form", string>>;

export type OptionsSectionId =
  | "general"
  | "translation"
  | "styles"
  | "provider"
  | "shortcuts"
  | "privacy"
  | "diagnostics"
  | "advanced";

export type OptionsSectionGroupId = "basic" | "system" | "support";

export type OptionsSectionGroup = {
  id: OptionsSectionGroupId;
  heading: string;
  sections: { id: OptionsSectionId; label: string }[];
};

export type RecentTargetLanguageEntry = {
  code: RecentTargetLanguage;
  label: string;
};

export type SettingsDraftState = {
  saveState: OptionsSaveState;
  hasUnsavedChanges: boolean;
  changedFields: (keyof UserSettings)[];
  changedFieldCount: number;
};

export type PopupSetupState = "ready" | "required" | "blocked";

const SUPPORTED_TARGET_LANGUAGE_CODES = [
  "id",
  "en",
  "ms",
  "zh-CN",
  "ja",
  "ko",
  "ar",
  "es"
] as const;
const STYLE_IDS = [
  "neutral",
  "formal",
  "casual",
  "friendly",
  "professional",
  "concise",
  "polite",
  "custom"
] as const;
const INCOMING_MODE_IDS = ["inline", "tooltip", "onDemand", "off"] as const;
const STARTUP_BEHAVIOR_IDS = ["restoreLastEnabled", "startDisabled"] as const;
const RECENT_TARGET_LANGUAGE_LIMIT = 5;
const DIAGNOSTIC_PROVIDER_STATUSES: readonly ProviderStatus[] = [
  "missing",
  "authRequired",
  "timeout",
  "rateLimited",
  "invalidOutput",
  "unsafeConfiguration",
  "versionMismatch",
  "unavailable"
];
const comparableSettingsFields: readonly (keyof UserSettings)[] = [
  "enabled",
  "onboardingStatus",
  "onboardingProgress",
  "privacyConsentVersion",
  "uiLanguage",
  "sourceLanguage",
  "targetLanguage",
  "recentTargetLanguages",
  "startupBehavior",
  "styleId",
  "customStyle",
  "incomingMode",
  "manualMode",
  "undoSeconds",
  "providerActive",
  "providerProfile",
  "providerTimeoutSeconds",
  "queueMaxPending",
  "providerConcurrency",
  "sessionCacheEnabled",
  "sessionCacheTtlMinutes",
  "telemetryEnabled",
  "promptContractVersion"
];

const areSettingsValuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export const languageOptions: SelectOption[] = SUPPORTED_TARGET_LANGUAGE_CODES.map((value) => ({
  value,
  label: en.languages[value]
}));

export const sourceLanguageOptions: SelectOption[] = [
  {
    value: "auto",
    label: en.languages.auto
  },
  ...languageOptions
];

export const styleOptions: SelectOption[] = STYLE_IDS.map((value) => ({
  value,
  label: en.styles[value]
}));

export const incomingModeOptions: SelectOption[] = INCOMING_MODE_IDS.map((value) => ({
  value,
  label: en.incomingModes[value]
}));

export const startupBehaviorOptions: SelectOption[] = STARTUP_BEHAVIOR_IDS.map((value) => ({
  value,
  label: en.common.startupBehaviors[value]
}));

export const providerOptions: SelectOption[] = [
  { value: "codex", label: "Codex CLI" },
  { value: "claude", label: "Claude Code CLI" }
];

export const optionsSectionGroups: OptionsSectionGroup[] = [
  {
    id: "basic",
    heading: en.options.groups.basic,
    sections: [
      { id: "general", label: en.options.sections.general },
      { id: "translation", label: en.options.sections.translation },
      { id: "styles", label: en.options.sections.styles }
    ]
  },
  {
    id: "system",
    heading: en.options.groups.system,
    sections: [
      { id: "provider", label: en.options.sections.provider },
      { id: "shortcuts", label: en.options.sections.shortcuts },
      { id: "privacy", label: en.options.sections.privacy }
    ]
  },
  {
    id: "support",
    heading: en.options.groups.support,
    sections: [
      { id: "diagnostics", label: en.options.sections.diagnostics },
      ...(isAdvancedSettingsVisible()
        ? [
            { id: "advanced", label: en.options.sections.advanced } satisfies {
              id: OptionsSectionId;
              label: string;
            }
          ]
        : [])
    ]
  }
];

export const getOptionsSectionGroupId = (
  section: OptionsSectionId
): OptionsSectionGroupId =>
  optionsSectionGroups.find((group) => group.sections.some((entry) => entry.id === section))?.id ??
  "basic";

export const getLanguageLabel = (languageCode: string): string =>
  en.languages[languageCode as keyof typeof en.languages] ?? languageCode;

export const getStyleLabel = (styleId: UserSettings["styleId"]): string =>
  en.styles[styleId] ?? styleId;

export const getIncomingModeLabel = (incomingMode: UserSettings["incomingMode"]): string =>
  en.incomingModes[incomingMode] ?? incomingMode;

export const getStartupBehaviorLabel = (
  startupBehavior: UserSettings["startupBehavior"]
): string => en.common.startupBehaviors[startupBehavior];

export const getProviderStatusLabel = (status: ProviderStatus): string => en.providerStates[status];

export const getPopupSetupState = (settings: UserSettings): PopupSetupState => {
  if (settings.onboardingStatus === "complete") {
    return "ready";
  }

  if (settings.onboardingStatus === "blocked") {
    return "blocked";
  }

  return "required";
};

export const shouldShowPopupDiagnostics = (providerHealth: ProviderHealth): boolean =>
  providerHealth.lastSanitizedError !== null || DIAGNOSTIC_PROVIDER_STATUSES.includes(providerHealth.state);

export const getProviderStateBadgeTone = (status: ProviderStatus): StateBadgeTone => {
  switch (status) {
    case "ready":
      return "ready";
    case "checking":
      return "info";
    case "missing":
    case "authRequired":
    case "timeout":
    case "rateLimited":
    case "invalidOutput":
    case "unsafeConfiguration":
    case "versionMismatch":
    case "unavailable":
      return "warning";
    default:
      return "neutral";
  }
};

export const getPopupProviderSummary = (status: ProviderStatus): string => {
  switch (status) {
    case "ready":
      return en.popup.providerReadySummary;
    case "checking":
      return en.popup.providerCheckingSummary;
    case "missing":
    case "authRequired":
    case "timeout":
    case "rateLimited":
    case "invalidOutput":
    case "unsafeConfiguration":
    case "versionMismatch":
    case "unavailable":
      return en.popup.providerAttentionSummary;
    default:
      return en.popup.providerPendingSummary;
  }
};

export const createDefaultShortcutStatusModel = (): ShortcutStatusModel => ({
  commandName: "manual-translate-selection",
  shortcut: null,
  state: "unassigned",
  summary: en.shortcuts.unassigned,
  details: en.shortcuts.fallback
});

export const buildShortcutStatusModel = (
  commands: Pick<chrome.commands.Command, "name" | "shortcut" | "description">[],
  commandName = "manual-translate-selection"
): ShortcutStatusModel => {
  const target = commands.find((command) => command.name === commandName);
  if (!target?.shortcut) {
    return createDefaultShortcutStatusModel();
  }

  const conflictingCommand = commands.find(
    (command) => command.name !== commandName && command.shortcut === target.shortcut
  );
  if (conflictingCommand) {
    return {
      commandName,
      shortcut: target.shortcut,
      state: "conflict",
      summary: en.shortcuts.conflict,
      details: `${target.shortcut} is also used by ${conflictingCommand.description ?? conflictingCommand.name}.`
    };
  }

  return {
    commandName,
    shortcut: target.shortcut,
    state: "assigned",
    summary: en.shortcuts.assigned,
    details: `${target.shortcut} is assigned to the manual translate command.`
  };
};

export const buildValidationMessages = (
  candidateSettings: UserSettings
): SettingsValidationMessages => {
  const validation = userSettingsSchema.safeParse(candidateSettings);
  if (validation.success) {
    return {};
  }

  return validation.error.issues.reduce<SettingsValidationMessages>((messages, issue) => {
    const pathKey = String(issue.path[0] ?? "form") as keyof SettingsValidationMessages;
    if (!messages[pathKey]) {
      messages[pathKey] = issue.message;
    }

    return messages;
  }, {});
};

export const sanitizeRecentTargetLanguages = (
  recentTargetLanguages: readonly string[]
): RecentTargetLanguage[] => {
  const sanitized: RecentTargetLanguage[] = [];

  for (const languageCode of recentTargetLanguages) {
    const parsed = recentTargetLanguageSchema.safeParse(languageCode);
    if (!parsed.success || sanitized.includes(parsed.data)) {
      continue;
    }

    sanitized.push(parsed.data);
    if (sanitized.length === RECENT_TARGET_LANGUAGE_LIMIT) {
      break;
    }
  }

  return sanitized;
};

export const updateRecentTargetLanguages = (
  recentTargetLanguages: readonly string[],
  targetLanguage: UserSettings["targetLanguage"]
): RecentTargetLanguage[] => {
  const parsed = recentTargetLanguageSchema.safeParse(targetLanguage);
  if (!parsed.success) {
    return sanitizeRecentTargetLanguages(recentTargetLanguages);
  }

  return sanitizeRecentTargetLanguages([parsed.data, ...recentTargetLanguages]);
};

export const buildRecentTargetLanguageEntries = (
  recentTargetLanguages: readonly string[]
): RecentTargetLanguageEntry[] =>
  sanitizeRecentTargetLanguages(recentTargetLanguages).map((code) => ({
    code,
    label: getLanguageLabel(code)
  }));

export const createTargetLanguageSettingsPatch = (
  currentSettings: UserSettings,
  targetLanguage: UserSettings["targetLanguage"]
): Pick<UserSettings, "targetLanguage" | "recentTargetLanguages"> => ({
  targetLanguage,
  recentTargetLanguages: updateRecentTargetLanguages(
    currentSettings.recentTargetLanguages,
    targetLanguage
  )
});

const buildPopupStateBadges = (
  setupState: PopupSetupState,
  enabled: boolean,
  providerHealth: ProviderHealth,
  diagnosticsAttentionRequired: boolean
): StateBadge[] => {
  const badges: StateBadge[] = [];

  if (setupState !== "ready") {
    badges.push({
      label: en.common.stateBadges.setupRequired,
      tone: "warning"
    });
  } else if (!enabled) {
    badges.push({
      label: en.common.stateBadges.paused,
      tone: "warning"
    });
  }

  badges.push({
    label: getProviderStatusLabel(providerHealth.state),
    tone: getProviderStateBadgeTone(providerHealth.state),
    supportingText: providerHealth.versionCategory ?? undefined
  });

  if (diagnosticsAttentionRequired) {
    badges.push({
      label: en.common.stateBadges.diagnostics,
      tone: "warning"
    });
  }

  return badges;
};

const buildPopupFooterLinks = (
  setupState: PopupSetupState,
  diagnosticsAttentionRequired: boolean
): SurfaceLink[] => {
  const links: SurfaceLink[] = [
    {
      id: "settings",
      label: en.popup.openSettings
    }
  ];

  if (setupState !== "ready") {
    links.push({
      id: "privacy",
      label: en.popup.privacyLabel
    });
  }

  if (diagnosticsAttentionRequired) {
    links.push({
      id: "diagnostics",
      label: en.popup.diagnosticsLabel
    });
  }

  return links;
};

export const buildPopupState = (input: {
  settings: UserSettings;
  providerHealth: ProviderHealth;
  shortcutStatus: ShortcutStatusModel;
}): PopupState => {
  const providerHealth = alignProviderHealthToProvider(
    input.settings.providerActive,
    input.providerHealth
  );
  const setupState = getPopupSetupState(input.settings);
  const diagnosticsAttentionRequired = shouldShowPopupDiagnostics(providerHealth);

  return popupStateSchema.parse({
    enabled: input.settings.enabled,
    targetLanguage: input.settings.targetLanguage,
    styleId: input.settings.styleId,
    incomingMode: input.settings.incomingMode,
    shortcutLabel: input.shortcutStatus.shortcut,
    providerStatus: providerHealth.state,
    diagnosticsAttentionRequired,
    hasValidatedSelection: false,
    setupState,
    recentTargetLanguages: sanitizeRecentTargetLanguages(input.settings.recentTargetLanguages),
    manualActionAvailable: setupState === "ready" && input.settings.enabled,
    providerSummary: {
      selectedProvider: input.settings.providerActive,
      readiness: providerHealth.state,
      autoDetectedPathSummary: null,
      manualOverrideState: "none",
      lastHealthCategory: providerHealth.lastLatencyBucket,
      safeProfileSummary: en.popup.safeProfileSummary,
      availableActions: diagnosticsAttentionRequired
        ? [
            {
              id: "open-diagnostics",
              label: en.common.actions.openDiagnostics,
              emphasis: "secondary"
            }
          ]
        : []
    },
    stateBadges: buildPopupStateBadges(
      setupState,
      input.settings.enabled,
      providerHealth,
      diagnosticsAttentionRequired
    ),
    footerLinks: buildPopupFooterLinks(setupState, diagnosticsAttentionRequired)
  });
};

export const buildSettingsDraftState = (input: {
  savedSettings: UserSettings;
  draftSettings: UserSettings;
  saveState: OptionsSaveState;
}): SettingsDraftState => {
  const changedFields = comparableSettingsFields.filter(
    (field) => !areSettingsValuesEqual(input.savedSettings[field], input.draftSettings[field])
  );

  return {
    saveState: input.saveState,
    hasUnsavedChanges: changedFields.length > 0,
    changedFields,
    changedFieldCount: changedFields.length
  };
};

export const buildOptionsState = (input: {
  activeSection: OptionsSectionId;
  saveState: OptionsSaveState;
  validationMessages: SettingsValidationMessages;
  telemetryEnabled: boolean;
  shortcutStatus: ShortcutStatusModel;
  savedSettings?: UserSettings;
  draftSettings?: UserSettings;
  recentTargetLanguages?: readonly string[];
  destructiveActionPending?: "clearLocalData" | "resetSettings" | null;
}) => {
  const draftState =
    input.savedSettings && input.draftSettings
      ? buildSettingsDraftState({
          savedSettings: input.savedSettings,
          draftSettings: input.draftSettings,
          saveState: input.saveState
        })
      : {
          saveState: input.saveState,
          hasUnsavedChanges: input.saveState === "dirty",
          changedFields: [] as (keyof UserSettings)[],
          changedFieldCount: 0
        };

  return optionsStateSchema.parse({
    activeSection: input.activeSection,
    saveState: input.saveState,
    hasBlockingValidation: Object.keys(input.validationMessages).length > 0,
    shortcutConflictDetected: input.shortcutStatus.state === "conflict",
    telemetryEnabled: input.telemetryEnabled,
    activeGroup: getOptionsSectionGroupId(input.activeSection),
    hasUnsavedChanges: draftState.hasUnsavedChanges,
    changedFieldCount: draftState.changedFieldCount,
    changedFields: draftState.changedFields.map(String),
    recentTargetLanguages: sanitizeRecentTargetLanguages(
      input.recentTargetLanguages ?? input.draftSettings?.recentTargetLanguages ?? []
    ),
    destructiveActionPending: input.destructiveActionPending ?? null
  });
};

export const getSaveStateMessage = (saveState: OptionsSaveState): string | null => {
  switch (saveState) {
    case "dirty":
      return en.options.dirty;
    case "saving":
      return en.options.saving;
    case "saved":
      return en.options.saved;
    case "validationError":
      return en.options.validationError;
    case "saveFailed":
      return en.options.saveFailed;
    default:
      return null;
  }
};

export const getLifecycleSummary = (providerHealth: ProviderHealth): string =>
  `${providerHealth.provider.toUpperCase()} | ${getProviderStatusLabel(providerHealth.state)}`;

export const createPartialSettingsPatch = (
  currentSettings: UserSettings,
  update: PartialUserSettings
): PartialUserSettings => ({
  ...update,
  ...(update.targetLanguage
    ? createTargetLanguageSettingsPatch(currentSettings, update.targetLanguage)
    : {})
});
