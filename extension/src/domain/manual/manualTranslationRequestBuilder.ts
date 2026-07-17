import type { ManualTargetSnapshot } from "./manualTargetSnapshot";
import type { UserSettings } from "../settings/userSettings";
import {
  translationRequestSchema,
  type TranslationRequest,
  type TranslationTargetType
} from "../../shared/contracts/translation";

const MAX_SOURCE_TEXT_LENGTH = 12_000;

const buildRequestId = (): string => `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const mapManualTargetToTranslationTarget = (
  snapshot: ManualTargetSnapshot
): TranslationTargetType =>
  snapshot.targetType === "nonEditableSelection" ? "nonEditableSelection" : "editableComposer";

export const buildManualTranslationRequest = (input: {
  sourceText: string;
  snapshot: ManualTargetSnapshot;
  settings: UserSettings;
  requestId?: string;
}): TranslationRequest =>
  translationRequestSchema.parse({
    contractVersion: "1.0",
    requestId: input.requestId ?? buildRequestId(),
    provider: input.settings.providerActive,
    mode: "manual",
    targetType: mapManualTargetToTranslationTarget(input.snapshot),
    sourceText: input.sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH),
    sourceLanguage: input.settings.sourceLanguage,
    targetLanguage: input.settings.targetLanguage,
    style: {
      id: input.settings.styleId,
      customInstruction:
        input.settings.styleId === "custom" && input.settings.customStyle
          ? input.settings.customStyle.instruction
          : null
    },
    preserve: ["emoji", "urls", "names", "mentions", "lineBreaks", "punctuation", "formatting", "phoneNumbers", "orderCodes"],
    glossary: [],
    context: [],
    settingsSnapshot: {
      incomingMode: input.settings.incomingMode,
      manualMode: input.settings.manualMode,
      promptContractVersion: input.settings.promptContractVersion
    },
    outputFormat: "json"
  });
