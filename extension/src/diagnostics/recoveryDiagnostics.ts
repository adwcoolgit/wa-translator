import type { DiagnosticsEvent, RecoveryAction, SanitizedError } from "../shared/contracts/diagnostics";
import type { DiagnosticsCollector } from "./diagnosticsCollector";
import { getRuntimeDiagnosticsCollector } from "./runtimeCollector";

const createEventId = (prefix: string): string =>
  `recovery-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEvent = (
  eventType: "translation_failed" | "setup_completed",
  properties: Record<string, string | number | boolean | null>,
  error: SanitizedError | null = null
): DiagnosticsEvent => ({
  eventId: createEventId(eventType),
  eventType,
  timestamp: Date.now(),
  properties,
  redactionStatus: "clean",
  error
});

export interface RecoveryDiagnosticsRecorder {
  recordRecoveryShown(surface: string, error: SanitizedError): DiagnosticsEvent;
  recordRecoveryAction(surface: string, error: SanitizedError, action: RecoveryAction): DiagnosticsEvent;
  recordPrivacyAction(action: "exportDiagnosticsPrepared" | "clearLocalData" | "resetSettings"): DiagnosticsEvent;
}

export const createRecoveryDiagnosticsRecorder = (
  collector: DiagnosticsCollector = getRuntimeDiagnosticsCollector()
): RecoveryDiagnosticsRecorder => ({
  recordRecoveryShown(surface, error) {
    return collector.record(
      createEvent(
        "translation_failed",
        {
          surface,
          errorCode: error.code,
          supportCode: error.supportCode
        },
        error
      )
    );
  },
  recordRecoveryAction(surface, error, action) {
    return collector.record(
      createEvent(
        "translation_failed",
        {
          surface,
          errorCode: error.code,
          supportCode: error.supportCode,
          recoveryAction: action
        },
        error
      )
    );
  },
  recordPrivacyAction(action) {
    return collector.record(
      createEvent("setup_completed", {
        privacyAction: action
      })
    );
  }
});