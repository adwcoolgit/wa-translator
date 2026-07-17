// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { createWhatsAppObserver } from "../../extension/src/content/whatsapp/whatsappObserver";

describe("DOM incompatibility fail-closed", () => {
  it("pauses automatic processing and cleans up when WhatsApp thread is unavailable", () => {
    document.body.innerHTML = "<main data-testid='outside-shell'></main>";

    const controller = {
      processRoot: vi.fn(),
      handleCompatibilityChange: vi.fn(),
      cleanup: vi.fn()
    };

    const observer = createWhatsAppObserver(controller, document);
    observer.start();

    expect(controller.handleCompatibilityChange).toHaveBeenCalledWith("incompatible");
    expect(controller.cleanup).toHaveBeenCalledTimes(1);
    expect(controller.processRoot).not.toHaveBeenCalled();
  });
});
