import type { UserSettings } from "../domain/settings/userSettings";
import type { DiagnosticsEvent } from "../shared/contracts/diagnostics";

export const ALLOWED_TELEMETRY_PROPERTY_KEYS = new Set([
  "action",
  "compatibilityState",
  "errorCode",
  "latencyBucket",
  "lifecycleState",
  "manualMode",
  "mode",
  "priority",
  "privacyAction",
  "provider",
  "providerState",
  "recoveryAction",
  "supportCode",
  "surface",
  "syntheticHealthCheckOnly",
  "targetType",
  "telemetryEnabled",
  "versionCategory"
]);

export const isTelemetryEnabled = (settings: Pick<UserSettings, "telemetryEnabled">): boolean =>
  settings.telemetryEnabled;

export const createContentFreeTelemetryEvent = (
  settings: Pick<UserSettings, "telemetryEnabled">,
  event: DiagnosticsEvent
): DiagnosticsEvent | null => {
  if (!isTelemetryEnabled(settings)) {
    return null;
  }

  const filteredProperties = Object.fromEntries(
    Object.entries(event.properties).filter(([key]) => ALLOWED_TELEMETRY_PROPERTY_KEYS.has(key))
  );

  return {
    ...event,
    properties: filteredProperties
  };
};
