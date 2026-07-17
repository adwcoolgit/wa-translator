import {
  adapterCompatibilityStateSchema,
  type AdapterCompatibilityState
} from "../../shared/contracts/domAdapter";
import { detectDomCompatibility } from "./domAnchorRegistry";
import { CHAT_THREAD_SELECTOR } from "./messageTextExtractor";

export interface WhatsAppObserverController {
  processRoot(root: ParentNode): void | Promise<void>;
  handleCompatibilityChange(state: AdapterCompatibilityState): void;
  cleanup(): void;
}

export class WhatsAppObserver {
  private observer: MutationObserver | null = null;

  public constructor(
    private readonly controller: WhatsAppObserverController,
    private readonly rootDocument: Document = document
  ) {}

  public start(): void {
    const compatibility = adapterCompatibilityStateSchema.parse(detectDomCompatibility(this.rootDocument));
    this.controller.handleCompatibilityChange(compatibility);

    if (compatibility !== "compatible") {
      this.controller.cleanup();
      return;
    }

    const thread = this.rootDocument.querySelector(CHAT_THREAD_SELECTOR);
    if (!thread) {
      this.controller.handleCompatibilityChange("incompatible");
      this.controller.cleanup();
      return;
    }

    this.controller.processRoot(thread);

    this.observer = new MutationObserver(() => {
      const nextCompatibility = adapterCompatibilityStateSchema.parse(detectDomCompatibility(this.rootDocument));
      this.controller.handleCompatibilityChange(nextCompatibility);
      if (nextCompatibility !== "compatible") {
        this.controller.cleanup();
        return;
      }

      this.controller.processRoot(thread);
    });

    this.observer.observe(thread, {
      childList: true,
      subtree: true
    });
  }

  public stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

export const createWhatsAppObserver = (
  controller: WhatsAppObserverController,
  rootDocument?: Document
): WhatsAppObserver => new WhatsAppObserver(controller, rootDocument);
