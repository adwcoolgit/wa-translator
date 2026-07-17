import {
  requestPriorityWeights,
  shouldDropOldestAutomaticRequest,
  transitionRequestState,
  type RequestPriority,
  type TranslationRequestState
} from "./requestState";

export type QueueDisposition = "stale" | "cancelled" | "dropped";

export class QueueDispositionError extends Error {
  public constructor(
    public readonly disposition: QueueDisposition,
    message: string
  ) {
    super(message);
    this.name = "QueueDispositionError";
  }
}

export interface TranslationQueueTask<TValue> {
  requestId: string;
  priority: RequestPriority;
  automatic: boolean;
  run: () => Promise<TValue>;
}

export interface TranslationQueueSnapshotEntry {
  requestId: string;
  priority: RequestPriority;
  automatic: boolean;
  state: Extract<TranslationRequestState, "queued" | "processing">;
}

type Deferred<TValue> = {
  resolve: (value: TValue) => void;
  reject: (reason?: unknown) => void;
};

type QueuedTaskRecord<TValue> = TranslationQueueTask<TValue> & {
  sequence: number;
  state: Extract<TranslationRequestState, "queued" | "processing">;
  deferred: Deferred<TValue>;
};

const sortPendingTasks = <TValue>(pending: QueuedTaskRecord<TValue>[]): void => {
  pending.sort((left, right) => {
    const weightDifference = requestPriorityWeights[right.priority] - requestPriorityWeights[left.priority];
    if (weightDifference !== 0) {
      return weightDifference;
    }

    return left.sequence - right.sequence;
  });
};

export class TranslationQueue<TValue> {
  private readonly pending: QueuedTaskRecord<TValue>[] = [];
  private readonly processing = new Map<string, QueuedTaskRecord<TValue>>();
  private sequence = 0;

  public constructor(
    private readonly concurrency = 2,
    private readonly maxPending = 50
  ) {}

  public enqueue(task: TranslationQueueTask<TValue>): Promise<TValue> {
    if (shouldDropOldestAutomaticRequest(this.pending.length, this.maxPending)) {
      const dropped = this.dropOldestAutomaticPendingTask();
      if (!dropped && task.automatic) {
        return Promise.reject(
          new QueueDispositionError("dropped", `Automatic request '${task.requestId}' was dropped because the queue is full.`)
        );
      }
    }

    return new Promise<TValue>((resolve, reject) => {
      const record: QueuedTaskRecord<TValue> = {
        ...task,
        sequence: this.sequence += 1,
        state: "queued",
        deferred: { resolve, reject }
      };

      this.pending.push(record);
      sortPendingTasks(this.pending);
      this.schedule();
    });
  }

  public markStale(predicate: (task: TranslationQueueSnapshotEntry) => boolean): string[] {
    return this.rejectPendingTasks(predicate, "stale", "Request became stale before execution.");
  }

  public cancelPending(predicate: (task: TranslationQueueSnapshotEntry) => boolean): string[] {
    return this.rejectPendingTasks(predicate, "cancelled", "Request was cancelled before execution.");
  }

  public snapshot(): TranslationQueueSnapshotEntry[] {
    return [
      ...this.pending.map((task) => ({
        requestId: task.requestId,
        priority: task.priority,
        automatic: task.automatic,
        state: task.state
      })),
      ...[...this.processing.values()].map((task) => ({
        requestId: task.requestId,
        priority: task.priority,
        automatic: task.automatic,
        state: task.state
      }))
    ];
  }

  private dropOldestAutomaticPendingTask(): boolean {
    const automaticTaskIndex = this.pending.findIndex((task) => task.automatic);
    if (automaticTaskIndex < 0) {
      return false;
    }

    const [task] = this.pending.splice(automaticTaskIndex, 1);
    task.deferred.reject(
      new QueueDispositionError("dropped", `Automatic request '${task.requestId}' was dropped because the queue is full.`)
    );
    return true;
  }

  private rejectPendingTasks(
    predicate: (task: TranslationQueueSnapshotEntry) => boolean,
    disposition: QueueDisposition,
    message: string
  ): string[] {
    const rejectedTaskIds: string[] = [];

    for (let index = this.pending.length - 1; index >= 0; index -= 1) {
      const task = this.pending[index];
      const snapshot: TranslationQueueSnapshotEntry = {
        requestId: task.requestId,
        priority: task.priority,
        automatic: task.automatic,
        state: task.state
      };

      if (!predicate(snapshot)) {
        continue;
      }

      this.pending.splice(index, 1);
      task.deferred.reject(new QueueDispositionError(disposition, `${message} (${task.requestId})`));
      rejectedTaskIds.push(task.requestId);
    }

    return rejectedTaskIds.reverse();
  }

  private schedule(): void {
    while (this.processing.size < this.concurrency && this.pending.length > 0) {
      const task = this.pending.shift();
      if (!task) {
        return;
      }

      task.state = transitionRequestState(task.state, "processing") as Extract<TranslationRequestState, "processing">;
      this.processing.set(task.requestId, task);

      void task.run()
        .then((value) => task.deferred.resolve(value))
        .catch((error) => task.deferred.reject(error))
        .finally(() => {
          this.processing.delete(task.requestId);
          this.schedule();
        });
    }
  }
}

export const createTranslationQueue = <TValue>(
  concurrency?: number,
  maxPending?: number
): TranslationQueue<TValue> => new TranslationQueue<TValue>(concurrency, maxPending);
