import type { ProviderHealth } from "../domain/provider/providerHealth";
import type { UserSettings } from "../domain/settings/userSettings";
import type { DiagnosticsCollector } from "./diagnosticsCollector";
import { getRuntimeDiagnosticsCollector } from "./runtimeCollector";
import { diagnosticsExportSchema, type DiagnosticsEvent, type DiagnosticsExport } from "../shared/contracts/diagnostics";

export interface DiagnosticsRuntimeMetadata {
  extensionVersion: string;
  manifestVersion: string;
  chromeVersion: string;
  osFamily: string;
  nativeHostVersion: string | null;
  protocolVersion: string | null;
}

export interface DiagnosticsHostMetadata {
  nativeHostVersion?: string | null;
  protocolVersion?: string | null;
}

const PROHIBITED_EXPORT_KEYS = new Set([
  "sourceText",
  "translation",
  "translatedText",
  "translationText",
  "messageText",
  "rawStderr",
  "fullExecutablePath",
  "customStyle",
  "customInstruction",
  "contactIdentity",
  "chatIdentity",
  "accountIdentifier",
  "credential",
  "token"
]);

const isSafePrimitive = (value: unknown): value is string | number | boolean | null =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  value === null;

const toSafeRecord = (input: Record<string, unknown>): Record<string, string | number | boolean | null> =>
  Object.fromEntries(
    Object.entries(input).flatMap(([key, value]) => {
      if (PROHIBITED_EXPORT_KEYS.has(key)) {
        return [];
      }

      if (!isSafePrimitive(value)) {
        return [];
      }

      return [[key, value]];
    })
  );

const sanitizeEvent = (event: DiagnosticsEvent): DiagnosticsEvent => ({
  ...event,
  properties: toSafeRecord(event.properties)
});

export const defaultRuntimeMetadataProvider = (): DiagnosticsRuntimeMetadata => {
  const manifest = typeof chrome !== "undefined" && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest()
    : null;
  const navigatorUserAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;

  return {
    extensionVersion: manifest?.version ?? "0.0.0-dev",
    manifestVersion: manifest?.manifest_version?.toString() ?? "3",
    chromeVersion: navigatorUserAgent || "unknown",
    osFamily: navigatorUserAgent.includes("Windows") ? "Windows" : "Unknown",
    nativeHostVersion: null,
    protocolVersion: "1.0"
  };
};

export const buildDiagnosticsSettingsSummary = (
  settings: UserSettings,
  providerHealth?: ProviderHealth
): Record<string, string | number | boolean | null> =>
  toSafeRecord({
    enabled: settings.enabled,
    onboardingStatus: settings.onboardingStatus,
    sourceLanguage: settings.sourceLanguage,
    targetLanguage: settings.targetLanguage,
    styleId: settings.styleId,
    customStyleConfigured: settings.customStyle !== null,
    incomingMode: settings.incomingMode,
    manualMode: settings.manualMode,
    undoSeconds: settings.undoSeconds,
    providerActive: settings.providerActive,
    providerProfileConfigured: settings.providerProfile !== null,
    providerTimeoutSeconds: settings.providerTimeoutSeconds,
    queueMaxPending: settings.queueMaxPending,
    providerConcurrency: settings.providerConcurrency,
    sessionCacheEnabled: settings.sessionCacheEnabled,
    sessionCacheTtlMinutes: settings.sessionCacheTtlMinutes,
    telemetryEnabled: settings.telemetryEnabled,
    promptContractVersion: settings.promptContractVersion,
    providerState: providerHealth?.state ?? null,
    providerLatencyBucket: providerHealth?.lastLatencyBucket ?? null,
    providerVersionCategory: providerHealth?.versionCategory ?? null
  });

export class DiagnosticsExportService {
  public constructor(
    private readonly collector: DiagnosticsCollector = getRuntimeDiagnosticsCollector(),
    private readonly runtimeMetadataProvider: () => DiagnosticsRuntimeMetadata = defaultRuntimeMetadataProvider
  ) {}

  public build(
    settings: UserSettings,
    providerHealth?: ProviderHealth,
    hostMetadata?: DiagnosticsHostMetadata
  ): DiagnosticsExport {
    const runtime = this.runtimeMetadataProvider();
    const sanitizedEvents = this.collector.list().map(sanitizeEvent);

    return diagnosticsExportSchema.parse({
      exportedAt: Date.now(),
      extensionVersion: runtime.extensionVersion,
      manifestVersion: runtime.manifestVersion,
      chromeVersion: runtime.chromeVersion,
      osFamily: runtime.osFamily,
      nativeHostVersion: hostMetadata?.nativeHostVersion ?? runtime.nativeHostVersion,
      protocolVersion: hostMetadata?.protocolVersion ?? runtime.protocolVersion,
      selectedProvider: settings.providerActive,
      settingsSummary: buildDiagnosticsSettingsSummary(settings, providerHealth),
      events: sanitizedEvents
    });
  }

  public serialize(
    settings: UserSettings,
    providerHealth?: ProviderHealth,
    hostMetadata?: DiagnosticsHostMetadata
  ): string {
    return JSON.stringify(this.build(settings, providerHealth, hostMetadata), null, 2);
  }
}

export const createDiagnosticsExportService = (
  collector?: DiagnosticsCollector,
  runtimeMetadataProvider?: () => DiagnosticsRuntimeMetadata
): DiagnosticsExportService => new DiagnosticsExportService(collector, runtimeMetadataProvider);



