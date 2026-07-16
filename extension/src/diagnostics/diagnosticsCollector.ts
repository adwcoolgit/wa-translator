import {
  diagnosticsEventSchema,
  diagnosticsExportSchema,
  type DiagnosticsEvent,
  type DiagnosticsExport
} from "../shared/contracts/diagnostics";

const DEFAULT_EVENT_CAPACITY = 500;

export class DiagnosticsCollector {
  private readonly events: DiagnosticsEvent[] = [];

  public constructor(private readonly capacity = DEFAULT_EVENT_CAPACITY) {}

  public record(event: DiagnosticsEvent): DiagnosticsEvent {
    const parsed = diagnosticsEventSchema.parse(event);

    if (this.events.length >= this.capacity) {
      this.events.shift();
    }

    this.events.push(parsed);
    return parsed;
  }

  public list(): DiagnosticsEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events.length = 0;
  }

  public export(input: Omit<DiagnosticsExport, "events">): DiagnosticsExport {
    return diagnosticsExportSchema.parse({
      ...input,
      events: this.list()
    });
  }
}

export const createDiagnosticsCollector = (capacity?: number): DiagnosticsCollector =>
  new DiagnosticsCollector(capacity);
