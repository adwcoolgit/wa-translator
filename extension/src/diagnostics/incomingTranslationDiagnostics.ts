import { createDiagnosticsCollector, type DiagnosticsCollector } from "./diagnosticsCollector";
import type { RequestPriority } from "../domain/translation/requestState";
import type { DiagnosticsEvent, SanitizedError } from "../shared/contracts/diagnostics";
import type { AdapterCompatibilityState } from "../shared/contracts/domAdapter";
import type { UserSettings } from "../domain/settings/userSettings";

const createEventId = (suffix: string): string =>
  `incoming-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEvent = (
  eventType: DiagnosticsEvent["eventType"],
  properties: DiagnosticsEvent["properties"],
  error: SanitizedError | null = null
): DiagnosticsEvent => ({
  eventId: createEventId(eventType),
  eventType,
  timestamp: Date.now(),
  properties,
  redactionStatus: "clean",
  error
});

export interface IncomingTranslationDiagnosticsRecorder {
  readonly collector: DiagnosticsCollector;
  recordTranslationRequested(input: {
    mode: UserSettings["incomingMode"];
    provider: UserSettings["providerActive"];
    priority: RequestPriority;
  }): DiagnosticsEvent;
  recordTranslationCompleted(input: {
    mode: UserSettings["incomingMode"];
    provider: UserSettings["providerActive"];
    latencyMs: number;
  }): DiagnosticsEvent;
  recordTranslationFailed(input: {
    mode: UserSettings["incomingMode"];
    provider: UserSettings["providerActive"];
    error: SanitizedError;
  }): DiagnosticsEvent;
  recordCompatibilityState(state: AdapterCompatibilityState): DiagnosticsEvent;
}

export const createIncomingTranslationDiagnosticsRecorder = (
  collector: DiagnosticsCollector = createDiagnosticsCollector()
): IncomingTranslationDiagnosticsRecorder => ({
  collector,
  recordTranslationRequested(input) {
    return collector.record(
      createEvent("translation_requested", {
        mode: input.mode,
        provider: input.provider,
        priority: input.priority
      })
    );
  },
  recordTranslationCompleted(input) {
    return collector.record(
      createEvent("translation_completed", {
        mode: input.mode,
        provider: input.provider,
        latencyBucket:
          input.latencyMs < 1000 ? "under-1s" : input.latencyMs < 3000 ? "1s-3s" : "over-3s"
      })
    );
  },
  recordTranslationFailed(input) {
    return collector.record(
      createEvent(
        "translation_failed",
        {
          mode: input.mode,
          provider: input.provider,
          errorCode: input.error.code
        },
        input.error
      )
    );
  },
  recordCompatibilityState(state) {
    return collector.record(
      createEvent("dom_adapter_incompatible", {
        compatibilityState: state
      })
    );
  }
});
