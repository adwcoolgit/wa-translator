import { createDiagnosticsCollector, type DiagnosticsCollector } from "./diagnosticsCollector";
import type { DiagnosticsEvent, SanitizedError } from "../shared/contracts/diagnostics";
import type { ManualTargetSnapshot } from "../domain/manual/manualTargetSnapshot";
import type { UserSettings } from "../domain/settings/userSettings";

const createEventId = (suffix: string): string =>
  `manual-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

export interface ManualTranslationDiagnosticsRecorder {
  readonly collector: DiagnosticsCollector;
  recordPreviewOpened(input: {
    target: ManualTargetSnapshot;
    provider: UserSettings["providerActive"];
    manualMode: UserSettings["manualMode"];
  }): DiagnosticsEvent;
  recordTranslationRequested(input: {
    target: ManualTargetSnapshot;
    provider: UserSettings["providerActive"];
  }): DiagnosticsEvent;
  recordTranslationCompleted(input: {
    target: ManualTargetSnapshot;
    provider: UserSettings["providerActive"];
    latencyMs: number;
  }): DiagnosticsEvent;
  recordTranslationFailed(input: {
    target: ManualTargetSnapshot;
    provider: UserSettings["providerActive"];
    error: SanitizedError;
  }): DiagnosticsEvent;
  recordApply(target: ManualTargetSnapshot): DiagnosticsEvent;
  recordCancel(target: ManualTargetSnapshot): DiagnosticsEvent;
  recordUndo(target: ManualTargetSnapshot): DiagnosticsEvent;
}

export const createManualTranslationDiagnosticsRecorder = (
  collector: DiagnosticsCollector = createDiagnosticsCollector()
): ManualTranslationDiagnosticsRecorder => ({
  collector,
  recordPreviewOpened(input) {
    return collector.record(
      createEvent("manual_preview_opened", {
        provider: input.provider,
        targetType: input.target.targetType,
        manualMode: input.manualMode
      })
    );
  },
  recordTranslationRequested(input) {
    return collector.record(
      createEvent("translation_requested", {
        provider: input.provider,
        mode: "manual",
        targetType: input.target.targetType
      })
    );
  },
  recordTranslationCompleted(input) {
    return collector.record(
      createEvent("translation_completed", {
        provider: input.provider,
        mode: "manual",
        targetType: input.target.targetType,
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
          provider: input.provider,
          mode: "manual",
          targetType: input.target.targetType,
          errorCode: input.error.code
        },
        input.error
      )
    );
  },
  recordApply(target) {
    return collector.record(
      createEvent("manual_apply", {
        targetType: target.targetType
      })
    );
  },
  recordCancel(target) {
    return collector.record(
      createEvent("manual_cancel", {
        targetType: target.targetType
      })
    );
  },
  recordUndo(target) {
    return collector.record(
      createEvent("manual_undo", {
        targetType: target.targetType
      })
    );
  }
});
