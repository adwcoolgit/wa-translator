import type { AdapterCompatibilityState } from "../../shared/contracts/domAdapter";
import type { DomAnchorRegistry } from "../whatsapp/domAnchorRegistry";

export interface StoppableTranslationObserver {
  stop(): void;
}

export class TranslationCleanup {
  public constructor(
    private readonly registry: DomAnchorRegistry,
    private readonly observer: StoppableTranslationObserver | null = null
  ) {}

  public cleanupForCompatibility(state: Extract<AdapterCompatibilityState, "disabled" | "incompatible" | "updated">): void {
    this.registry.setCompatibilityState(state);
    this.observer?.stop();
    this.registry.cleanupAll();
  }

  public cleanupForDisposal(): void {
    this.observer?.stop();
    this.registry.cleanupAll();
  }
}

export const createTranslationCleanup = (
  registry: DomAnchorRegistry,
  observer?: StoppableTranslationObserver | null
): TranslationCleanup => new TranslationCleanup(registry, observer ?? null);
