import type { DiagnosticsCollector } from "./diagnosticsCollector";
import { getRuntimeDiagnosticsCollector } from "./runtimeCollector";
import type { ProviderHealth } from "../domain/provider/providerHealth";
import type { DiagnosticsEvent } from "../shared/contracts/diagnostics";
import type { NativeLifecycleResult } from "../shared/contracts/nativeMessaging";

const createEventId = (suffix: string): string =>
  `setup-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createSetupEvent = (
  eventType: DiagnosticsEvent["eventType"],
  properties: DiagnosticsEvent["properties"],
  error: DiagnosticsEvent["error"] = null
): DiagnosticsEvent => ({
  eventId: createEventId(eventType),
  eventType,
  timestamp: Date.now(),
  properties,
  redactionStatus: "clean",
  error
});

export interface SetupDiagnosticsRecorder {
  readonly collector: DiagnosticsCollector;
  recordSetupStarted(step: string): DiagnosticsEvent;
  recordSetupCompleted(provider: ProviderHealth, lifecycle: NativeLifecycleResult): DiagnosticsEvent;
  recordProviderHealthCheck(provider: ProviderHealth): DiagnosticsEvent;
}

export const createSetupDiagnosticsRecorder = (
  collector: DiagnosticsCollector = getRuntimeDiagnosticsCollector()
): SetupDiagnosticsRecorder => ({
  collector,
  recordSetupStarted(step) {
    return collector.record(
      createSetupEvent("setup_started", {
        step,
        syntheticHealthCheckOnly: true
      })
    );
  },
  recordSetupCompleted(provider, lifecycle) {
    return collector.record(
      createSetupEvent("setup_completed", {
        provider: provider.provider,
        providerState: provider.state,
        lifecycleState: lifecycle.state,
        syntheticHealthCheckOnly: true
      })
    );
  },
  recordProviderHealthCheck(provider) {
    return collector.record(
      createSetupEvent(
        "provider_health_check",
        {
          provider: provider.provider,
          providerState: provider.state,
          latencyBucket: provider.lastLatencyBucket,
          versionCategory: provider.versionCategory
        },
        provider.lastSanitizedError
      )
    );
  }
});