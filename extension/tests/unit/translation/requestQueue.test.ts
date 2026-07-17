import { afterEach, describe, expect, it, vi } from "vitest";

import {
  QueueDispositionError,
  TranslationQueue
} from "../../../src/domain/translation/translationQueue";

describe("TranslationQueue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prioritizes visible incoming work ahead of background automatic work", async () => {
    vi.useFakeTimers();
    const queue = new TranslationQueue<string>(1, 10);
    const completed: string[] = [];

    const backgroundPromise = queue.enqueue({
      requestId: "background-1",
      priority: "backgroundIncoming",
      automatic: true,
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        completed.push("background-1");
        return "background-1";
      }
    });

    const visiblePromise = queue.enqueue({
      requestId: "visible-1",
      priority: "visibleIncoming",
      automatic: true,
      run: async () => {
        completed.push("visible-1");
        return "visible-1";
      }
    });

    await vi.runAllTimersAsync();
    await expect(backgroundPromise).resolves.toBe("background-1");
    await expect(visiblePromise).resolves.toBe("visible-1");
    expect(completed).toEqual(["background-1", "visible-1"]);
  });

  it("marks queued requests as stale before execution", async () => {
    vi.useFakeTimers();
    const queue = new TranslationQueue<string>(1, 10);

    const processingPromise = queue.enqueue({
      requestId: "processing-1",
      priority: "visibleIncoming",
      automatic: true,
      run: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "processing-1";
      }
    });

    const stalePromise = queue.enqueue({
      requestId: "stale-1",
      priority: "backgroundIncoming",
      automatic: true,
      run: async () => "stale-1"
    });

    expect(queue.markStale((task) => task.requestId === "stale-1")).toEqual(["stale-1"]);

    await expect(stalePromise).rejects.toBeInstanceOf(QueueDispositionError);
    await vi.runAllTimersAsync();
    await expect(processingPromise).resolves.toBe("processing-1");
  });
});
