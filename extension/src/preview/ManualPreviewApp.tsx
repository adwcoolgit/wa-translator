import React, { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { createSanitizedError } from "../domain/errors/sanitizedErrors";
import type { TranslationRequestState } from "../domain/translation/requestState";
import { sanitizedErrorCodeSchema } from "../shared/contracts/diagnostics";
import type { SanitizedTranslationError } from "../shared/contracts/translation";
import { presentRecoverableError } from "../shared/errors/recoverableErrorPresenter";
import { getManualPreviewResultPlaceholder } from "./manualPreviewMessaging";
import { TargetChangedWarning } from "./components/TargetChangedWarning";

export interface ManualPreviewModel {
  open: boolean;
  sourceText: string;
  translation: string | null;
  targetType: "editableSelection" | "fullComposer" | "caretInsert" | "nonEditableSelection";
  targetLabel: string;
  targetDescription: string;
  requestSummary: string;
  targetChanged: boolean;
  canApply: boolean;
  canCopy: boolean;
  canCancel: boolean;
  canUndo: boolean;
  canRetry: boolean;
  requestState: TranslationRequestState;
  statusText: string;
  error: SanitizedTranslationError | null;
  applyLabel: string | null;
  retryLabel: string | null;
  copyLabel: string;
  undoLabel: string;
  staleReason: string | null;
  draftProtectionSummary: string | null;
}

export interface ManualPreviewHandlers {
  onApply?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onUndo?: () => void | Promise<void>;
}

export interface ManualPreviewAppProps {
  model: ManualPreviewModel;
  handlers: ManualPreviewHandlers;
}

const normalizeRecoverableError = (error: SanitizedTranslationError) => {
  const parsed = sanitizedErrorCodeSchema.safeParse(error.code);
  return createSanitizedError(parsed.success ? parsed.data : "PROVIDER_INVALID_OUTPUT");
};

const describeRequestState = (
  requestState: TranslationRequestState,
  error: SanitizedTranslationError | null,
  statusText: string
): string => {
  if (statusText.trim()) {
    return statusText;
  }

  switch (requestState) {
    case "queued":
      return "Translation queued.";
    case "processing":
      return "Translating current target.";
    case "validating":
      return "Validating target before apply.";
    case "success":
      return "Translation ready for review.";
    case "error":
      return error ? `Translation failed: ${error.code}.` : "Translation failed.";
    case "stale":
      return "Translation result is stale.";
    case "cancelled":
      return "Translation cancelled.";
    case "dropped":
      return "Translation request was dropped.";
    default:
      return "Choose a supported target to begin.";
  }
};

export function ManualPreviewApp({ model, handlers }: ManualPreviewAppProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const recoveryPresentation = model.error
    ? presentRecoverableError(normalizeRecoverableError(model.error))
    : null;

  useEffect(() => {
    if (model.open) {
      dialogRef.current?.focus();
    }
  }, [model.open]);

  return (
    <>
      {model.open ? (
        <section
          aria-label="Manual translation preview"
          data-surface="manual-preview"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              void handlers.onCancel?.();
            }
          }}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <header>
            <p>WA Translator</p>
            <h1>Manual translation preview</h1>
            <p>{model.targetLabel}</p>
            <p>{model.requestSummary}</p>
          </header>
          <p aria-live="polite">{describeRequestState(model.requestState, model.error, model.statusText)}</p>

          {model.targetChanged && model.staleReason ? (
            <TargetChangedWarning reason={model.staleReason} targetType={model.targetType} />
          ) : null}

          <section>
            <h2>Source snippet</h2>
            <p>{model.targetDescription}</p>
            <p data-testid="manual-preview-source">{model.sourceText || "No source text captured."}</p>
          </section>

          <section>
            <h2>Translation result</h2>
            <p data-testid="manual-preview-translation">
              {model.translation ?? getManualPreviewResultPlaceholder(model.requestState)}
            </p>
          </section>

          {model.draftProtectionSummary ? <p>{model.draftProtectionSummary}</p> : null}

          {recoveryPresentation && !model.targetChanged ? (
            <section aria-label="Manual preview recovery" data-testid="manual-preview-error">
              <strong>{recoveryPresentation.title}</strong>
              <p>{recoveryPresentation.body}</p>
            </section>
          ) : null}

          <div>
            <button
              disabled={!model.canCancel}
              onClick={() => void handlers.onCancel?.()}
              type="button"
            >
              Cancel
            </button>
            {model.retryLabel ? (
              <button
                disabled={!model.canRetry}
                onClick={() => void handlers.onRetry?.()}
                type="button"
              >
                {model.retryLabel}
              </button>
            ) : null}
            <button
              disabled={!model.canCopy}
              onClick={() => void handlers.onCopy?.()}
              type="button"
            >
              {model.copyLabel}
            </button>
            {model.applyLabel ? (
              <button
                disabled={!model.canApply}
                onClick={() => void handlers.onApply?.()}
                type="button"
              >
                {model.applyLabel}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {model.canUndo ? (
        <section aria-live="polite" data-surface="manual-undo" role="status">
          <p>Translation applied to the composer. Undo is available for the most recent manual change.</p>
          <button onClick={() => void handlers.onUndo?.()} type="button">
            {model.undoLabel}
          </button>
        </section>
      ) : null}
    </>
  );
}

export interface ManualPreviewHandle {
  update(props: ManualPreviewAppProps): void;
  unmount(): void;
}

export const mountManualPreviewApp = (
  container: HTMLElement,
  props: ManualPreviewAppProps
): ManualPreviewHandle => {
  const root: Root = createRoot(container);

  const render = (nextProps: ManualPreviewAppProps): void => {
    root.render(<ManualPreviewApp {...nextProps} />);
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
