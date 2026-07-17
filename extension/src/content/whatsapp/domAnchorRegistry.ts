import {
  adapterCompatibilityStateSchema,
  domAnchorSchema,
  type AdapterCompatibilityState,
  type DomAnchorContract,
  type DomAnchorValidity
} from "../../shared/contracts/domAdapter";
import { CHAT_THREAD_SELECTOR } from "./messageTextExtractor";

export interface DomAnchorRecord {
  anchor: DomAnchorContract;
  messageElement: HTMLElement;
  translationRegion: HTMLElement | null;
  popoverRegion: HTMLElement | null;
}

export const createAnchorId = (messageFingerprintId: string): string => `anchor-${messageFingerprintId}`;

export const detectDomCompatibility = (root: ParentNode): AdapterCompatibilityState => {
  const rootElement = root instanceof Document ? root.body : root;
  return rootElement.querySelector?.(CHAT_THREAD_SELECTOR) ? "compatible" : "incompatible";
};

export class DomAnchorRegistry {
  private readonly anchors = new Map<string, DomAnchorRecord>();
  private compatibilityState: AdapterCompatibilityState = "compatible";

  public setCompatibilityState(state: AdapterCompatibilityState): void {
    this.compatibilityState = adapterCompatibilityStateSchema.parse(state);
  }

  public getCompatibilityState(): AdapterCompatibilityState {
    return this.compatibilityState;
  }

  public registerMessageAnchor(input: {
    chatScope: string;
    messageFingerprintId: string;
    adapterVersion: string;
    messageElement: HTMLElement;
  }): DomAnchorContract {
    const anchor = domAnchorSchema.parse({
      anchorId: createAnchorId(input.messageFingerprintId),
      chatScope: input.chatScope,
      messageFingerprintId: input.messageFingerprintId,
      adapterVersion: input.adapterVersion,
      kind: "messageText",
      validity: "valid"
    });

    this.anchors.set(anchor.anchorId, {
      anchor,
      messageElement: input.messageElement,
      translationRegion: null,
      popoverRegion: null
    });

    return anchor;
  }

  public attachTranslationRegion(anchorId: string, region: HTMLElement | null): void {
    const record = this.anchors.get(anchorId);
    if (record) {
      record.translationRegion = region;
    }
  }

  public attachPopoverRegion(anchorId: string, region: HTMLElement | null): void {
    const record = this.anchors.get(anchorId);
    if (record) {
      record.popoverRegion = region;
    }
  }

  public getMessageElement(anchorId: string): HTMLElement | null {
    return this.anchors.get(anchorId)?.messageElement ?? null;
  }

  public validateAnchor(anchorId: string): DomAnchorValidity {
    if (this.compatibilityState === "incompatible") {
      return "incompatible";
    }

    if (this.compatibilityState === "disabled") {
      return "disabled";
    }

    const record = this.anchors.get(anchorId);
    if (!record) {
      return "missing";
    }

    if (!record.messageElement.isConnected) {
      return "missing";
    }

    return "valid";
  }

  public cleanupInvalidAnchors(): string[] {
    const removedAnchorIds: string[] = [];

    for (const [anchorId, record] of this.anchors.entries()) {
      if (record.messageElement.isConnected) {
        continue;
      }

      record.translationRegion?.remove();
      record.popoverRegion?.remove();
      this.anchors.delete(anchorId);
      removedAnchorIds.push(anchorId);
    }

    return removedAnchorIds;
  }

  public cleanupAll(): void {
    for (const record of this.anchors.values()) {
      record.translationRegion?.remove();
      record.popoverRegion?.remove();
    }

    this.anchors.clear();
  }
}

export const createDomAnchorRegistry = (): DomAnchorRegistry => new DomAnchorRegistry();
