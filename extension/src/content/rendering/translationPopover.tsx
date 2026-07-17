import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { buildTranslationActionState, runTranslationAction, type TranslationActionHandlers } from "./translationActions";
import type { SanitizedTranslationError } from "../../shared/contracts/translation";
import type { TranslationRequestState } from "../../domain/translation/requestState";

export interface TranslationPopoverProps {
  anchorId: string;
  requestState: TranslationRequestState;
  translation: string | null;
  error: SanitizedTranslationError | null;
  open: boolean;
  onClose: () => void;
  actions: TranslationActionHandlers;
}

const describeState = (
  requestState: TranslationRequestState,
  error: SanitizedTranslationError | null
): string => {
  switch (requestState) {
    case "queued":
      return "Translation queued.";
    case "processing":
      return "Translation in progress.";
    case "validating":
      return "Validating provider output.";
    case "success":
      return "Translation ready.";
    case "error":
      return error ? `Translation failed: ${error.code}.` : "Translation failed.";
    case "stale":
      return "Translation result became stale.";
    case "cancelled":
      return "Translation cancelled.";
    case "dropped":
      return "Translation dropped because the queue is full.";
    default:
      return "Translation is idle.";
  }
};

export function TranslationPopover({
  anchorId,
  requestState,
  translation,
  error,
  open,
  onClose,
  actions
}: TranslationPopoverProps) {
  const actionState = buildTranslationActionState({
    requestState,
    translation,
    error,
    mode: "tooltip"
  });

  if (!open) {
    return null;
  }

  return (
    <section
      aria-label="Translation details"
      className="wa-translator-popover"
      data-anchor-id={anchorId}
      data-surface="translation-popover"
      role="dialog"
    >
      <header>
        <strong>WA Translator</strong>
        <button aria-label="Close translation details" onClick={onClose} type="button">
          Close
        </button>
      </header>
      <p aria-live="polite">{describeState(requestState, error)}</p>
      {translation ? <p data-testid="translation-text">{translation}</p> : null}
      {error ? <p data-testid="translation-error">{error.recoveryAction}</p> : null}
      <div className="wa-translator-popover-actions">
        {actionState.canCopy ? (
          <button onClick={() => void runTranslationAction(actions.onCopy)} type="button">
            Copy translation
          </button>
        ) : null}
        {actionState.canRetry ? (
          <button onClick={() => void runTranslationAction(actions.onRetry)} type="button">
            Retry
          </button>
        ) : null}
        {actionState.canHide ? (
          <button onClick={() => void runTranslationAction(actions.onHide)} type="button">
            Hide
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
