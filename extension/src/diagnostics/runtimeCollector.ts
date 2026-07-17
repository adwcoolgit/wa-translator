import type { DiagnosticsCollector } from "./diagnosticsCollector";
import { createDiagnosticsCollector } from "./diagnosticsCollector";

const runtimeDiagnosticsCollector = createDiagnosticsCollector();

export const getRuntimeDiagnosticsCollector = (): DiagnosticsCollector => runtimeDiagnosticsCollector;

export const clearRuntimeDiagnosticsCollector = (): void => {
  runtimeDiagnosticsCollector.clear();
};
