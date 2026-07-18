import { afterEach, describe, expect, it, vi } from "vitest";

import { triggerManualTranslationFromPopup } from "../../../src/popup/popupActions";

const originalChrome = globalThis.chrome;

describe("popupActions", () => {
  afterEach(() => {
    vi.restoreAllMocks();

    if (originalChrome) {
      globalThis.chrome = originalChrome;
      return;
    }

    delete (globalThis as { chrome?: typeof chrome }).chrome;
  });

  it("sends the manual preview trigger to the active WhatsApp Web tab", async () => {
    const query = vi.fn().mockResolvedValue([
      {
        id: 17,
        url: "https://web.whatsapp.com/"
      }
    ]);
    const sendMessage = vi.fn().mockResolvedValue({
      type: "manual.start.result",
      payload: {
        accepted: true
      }
    });

    globalThis.chrome = {
      tabs: {
        query,
        sendMessage
      }
    } as unknown as typeof chrome;

    await expect(triggerManualTranslationFromPopup()).resolves.toBe("sent");
    expect(sendMessage).toHaveBeenCalledWith(17, {
      type: "manual.start",
      payload: {
        source: "action"
      }
    });
  });

  it("returns an unsupported-context result outside WhatsApp Web", async () => {
    const query = vi.fn().mockResolvedValue([
      {
        id: 23,
        url: "https://example.com/"
      }
    ]);
    const sendMessage = vi.fn();

    globalThis.chrome = {
      tabs: {
        query,
        sendMessage
      }
    } as unknown as typeof chrome;

    await expect(triggerManualTranslationFromPopup()).resolves.toBe("unsupportedContext");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("returns an unsupported-context result when the content receiver is unavailable", async () => {
    const query = vi.fn().mockResolvedValue([
      {
        id: 31,
        url: "https://web.whatsapp.com/"
      }
    ]);
    const sendMessage = vi.fn().mockRejectedValue(
      new Error("Could not establish connection. Receiving end does not exist.")
    );

    globalThis.chrome = {
      tabs: {
        query,
        sendMessage
      }
    } as unknown as typeof chrome;

    await expect(triggerManualTranslationFromPopup()).resolves.toBe("unsupportedContext");
  });
});

