import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import type { RecoveryAction } from "../../shared/contracts/diagnostics";
import { RecoveryActionPanel } from "../../shared/components/RecoveryActionPanel";

export interface DomCompatibilityBannerProps {
  state: "degraded" | "incompatible";
  onAction?: (action: RecoveryAction) => void;
}

function DomCompatibilityBanner({ state, onAction }: DomCompatibilityBannerProps) {
  return (
    <section aria-label="DOM compatibility warning" data-surface="dom-compatibility-banner">
      <p>
        {state === "degraded"
          ? "WA Translator is using a degraded compatibility mode."
          : "WA Translator paused automatic translation because WhatsApp Web changed."}
      </p>
      <RecoveryActionPanel
        compact
        error={createSanitizedError("DOM_ADAPTER_INCOMPATIBLE")}
        onAction={onAction}
      />
    </section>
  );
}

export interface DomCompatibilityBannerHandle {
  update(props: DomCompatibilityBannerProps): void;
  unmount(): void;
}

export const mountDomCompatibilityBanner = (
  container: HTMLElement,
  props: DomCompatibilityBannerProps
): DomCompatibilityBannerHandle => {
  const root: Root = createRoot(container);

  const render = (nextProps: DomCompatibilityBannerProps): void => {
    root.render(<DomCompatibilityBanner {...nextProps} />);
  };

  render(props);

  return {
    update(nextProps) {
      render(nextProps);
    },
    unmount() {
      root.unmount();
      container.remove();
    }
  };
};
