import type { OptionsSectionId } from "../domain/settings/settingsViewModel";
import { isAdvancedSettingsVisible } from "../shared/featureFlags/mvpFeatureFlags";

const OPTION_SECTION_IDS = [
  "general",
  "translation",
  "styles",
  "provider",
  "shortcuts",
  "privacy",
  "diagnostics"
] as const satisfies readonly OptionsSectionId[];

export const parseOptionsSectionFromHash = (hash: string): OptionsSectionId => {
  const section = hash.replace(/^#/, "");
  if (section === "advanced") {
    return isAdvancedSettingsVisible() ? "advanced" : "translation";
  }

  return OPTION_SECTION_IDS.includes(section as (typeof OPTION_SECTION_IDS)[number])
    ? (section as (typeof OPTION_SECTION_IDS)[number])
    : "translation";
};