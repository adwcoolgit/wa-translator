// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createWhatsAppObserver } from "../../extension/src/content/whatsapp/whatsappObserver";
import { mountDomCompatibilityBanner } from "../../extension/src/content/rendering/domCompatibilityBanner";

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

  it("renders plain-language compatibility copy without implying WhatsApp ownership", async () => {
    const mountNode = document.createElement("div");
    document.body.append(mountNode);

    let handle: ReturnType<typeof mountDomCompatibilityBanner> | null = null;
    await act(async () => {
      handle = mountDomCompatibilityBanner(mountNode, {
        state: "incompatible"
      });
    });

    expect(screen.getByText(/wa translator compatibility/i)).toBeInTheDocument();
    expect(screen.getByText(/no longer safe for automatic rendering/i)).toBeInTheDocument();
    expect(screen.queryByText(/official whatsapp/i)).not.toBeInTheDocument();

    await act(async () => {
      handle?.unmount();
    });
  });
});
