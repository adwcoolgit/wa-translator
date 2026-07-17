import type { ProviderHealth } from "../provider/providerHealth";
import { userSettingsSchema, type UserSettings } from "./userSettings";
import { optionsStateSchema, type OptionsSaveState, type ProviderStatus } from "../../shared/contracts/uiState";
import { isAdvancedSettingsVisible } from "../../shared/featureFlags/mvpFeatureFlags";
import { en } from "../../shared/i18n/en";

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

export type OptionsSectionGroup = {
  heading: string;
  sections: { id: OptionsSectionId; label: string }[];
};

const SUPPORTED_LANGUAGE_CODES = ["id", "en", "ms", "zh-CN", "ja", "ko", "ar", "es"] as const;
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

export const languageOptions: SelectOption[] = SUPPORTED_LANGUAGE_CODES.map((value) => ({
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

export const providerOptions: SelectOption[] = [
  { value: "codex", label: "Codex CLI" },
  { value: "claude", label: "Claude Code CLI" }
];

export const optionsSectionGroups: OptionsSectionGroup[] = [
  {
    heading: en.options.groups.basic,
    sections: [
      { id: "general", label: en.options.sections.general },
      { id: "translation", label: en.options.sections.translation },
      { id: "styles", label: en.options.sections.styles }
    ]
  },
  {
    heading: en.options.groups.system,
    sections: [
      { id: "provider", label: en.options.sections.provider },
      { id: "shortcuts", label: en.options.sections.shortcuts },
      { id: "privacy", label: en.options.sections.privacy }
    ]
  },
  {
    heading: en.options.groups.support,
    sections: [
      { id: "diagnostics", label: en.options.sections.diagnostics },
      ...(isAdvancedSettingsVisible()
        ? [{ id: "advanced", label: en.options.sections.advanced } satisfies { id: OptionsSectionId; label: string }]
        : [])
    ]
  }
];

export const getLanguageLabel = (languageCode: string): string =>
  en.languages[languageCode as keyof typeof en.languages] ?? languageCode;

export const getStyleLabel = (styleId: UserSettings["styleId"]): string =>
  en.styles[styleId] ?? styleId;

export const getIncomingModeLabel = (incomingMode: UserSettings["incomingMode"]): string =>
  en.incomingModes[incomingMode] ?? incomingMode;

export const getProviderStatusLabel = (status: ProviderStatus): string => en.providerStates[status];

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

export const buildOptionsState = (input: {
  activeSection: OptionsSectionId;
  saveState: OptionsSaveState;
  validationMessages: SettingsValidationMessages;
  telemetryEnabled: boolean;
  shortcutStatus: ShortcutStatusModel;
}) =>
  optionsStateSchema.parse({
    activeSection: input.activeSection,
    saveState: input.saveState,
    hasBlockingValidation: Object.keys(input.validationMessages).length > 0,
    shortcutConflictDetected: input.shortcutStatus.state === "conflict",
    telemetryEnabled: input.telemetryEnabled
  });

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