import React, { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { TranslationRequestState } from "../../domain/translation/requestState";
import { RecoveryActionPanel } from "../../shared/components/RecoveryActionPanel";
import type { SanitizedTranslationError } from "../../shared/contracts/translation";
import {
  buildTranslationUiState,
  runTranslationAction,
  type TranslationActionHandlers
} from "./translationActions";

export interface TranslationPopoverProps {
  anchorId: string;
  requestState: TranslationRequestState;
  translation: string | null;
  error: SanitizedTranslationError | null;
  open: boolean;
  onClose: () => void;
  actions: TranslationActionHandlers;
}

export function TranslationPopover({
  anchorId,
  requestState,
  translation,
  error,
  open,
  onClose,
  actions
}: TranslationPopoverProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const uiState = buildTranslationUiState({
    requestState,
    translation,
    error,
    mode: "tooltip",
    translationVisible: Boolean(translation),
    originalVisible: true,
    focusRestorationKey: anchorId
  });

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <section
      aria-label="Translation details"
      className="wa-translator-popover"
      data-anchor-id={anchorId}
      data-surface="translation-popover"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      role="dialog"
    >
      <header>
        <strong>{uiState.ownerLabel}</strong>
        <button
          aria-label="Close translation details"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          Close
        </button>
      </header>
      <p>{uiState.surfaceDescription}</p>
      <p aria-live="polite">{uiState.statusText}</p>
      {translation ? <p data-testid="translation-text">{translation}</p> : null}
      {error ? (
        <div data-testid="translation-error">
          <RecoveryActionPanel compact error={error} />
        </div>
      ) : null}
      <div className="wa-translator-popover-actions">
        {uiState.copyLabel ? (
          <button onClick={() => void runTranslationAction(actions.onCopy)} type="button">
            {uiState.copyLabel}
          </button>
        ) : null}
        {uiState.retryLabel ? (
          <button onClick={() => void runTranslationAction(actions.onRetry)} type="button">
            {uiState.retryLabel}
          </button>
        ) : null}
        {uiState.hideLabel ? (
          <button onClick={() => void runTranslationAction(actions.onHide)} type="button">
            {uiState.hideLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export interface TranslationPopoverHandle {
  update(props: TranslationPopoverProps): void;
  unmount(): void;
}

export const mountTranslationPopover = (
  container: HTMLElement,
  props: TranslationPopoverProps
): TranslationPopoverHandle => {
  const root: Root = createRoot(container);

  const render = (nextProps: TranslationPopoverProps): void => {
    root.render(<TranslationPopover {...nextProps} />);
  };

  render(props);

  return {
    update(nextProps) {
      render(nextProps);
    },
    unmount() {
      root.unmount();
      container.replaceChildren();
    }
  };
};
