import React from "react";
import { createRoot, type Root } from "react-dom/client";

import type { TranslationRequestState } from "../domain/translation/requestState";
import type { SanitizedTranslationError } from "../shared/contracts/translation";
import { TargetChangedWarning } from "./components/TargetChangedWarning";

export interface ManualPreviewModel {
  open: boolean;
  sourceText: string;
  translation: string | null;
  targetType: "editableSelection" | "fullComposer" | "caretInsert" | "nonEditableSelection";
  targetChanged: boolean;
  canApply: boolean;
  canCopy: boolean;
  canCancel: boolean;
  canUndo: boolean;
  requestState: TranslationRequestState;
  error: SanitizedTranslationError | null;
  applyLabel: string | null;
  undoLabel: string;
}

export interface ManualPreviewHandlers {
  onApply?: () => void | Promise<void>;
  onCopy?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onUndo?: () => void | Promise<void>;
}

export interface ManualPreviewAppProps {
  model: ManualPreviewModel;
  handlers: ManualPreviewHandlers;
}

const describeRequestState = (
  requestState: TranslationRequestState,
  error: SanitizedTranslationError | null
): string => {
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
  return (
    <>
      {model.open ? (
        <section
          aria-label="Manual translation preview"
          data-surface="manual-preview"
          role="dialog"
        >
          <header>
            <p>WA Translator</p>
            <h1>Manual translation preview</h1>
          </header>
          <p aria-live="polite">{describeRequestState(model.requestState, model.error)}</p>

          {model.targetChanged ? <TargetChangedWarning targetType={model.targetType} /> : null}

          <section>
            <h2>Original</h2>
            <p data-testid="manual-preview-source">{model.sourceText || "No source text captured."}</p>
          </section>

          <section>
            <h2>Translation</h2>
            <p data-testid="manual-preview-translation">
              {model.translation ?? "Translation result will appear here."}
            </p>
          </section>

          {model.error ? <p data-testid="manual-preview-error">{model.error.recoveryAction}</p> : null}

          <div>
            <button
              disabled={!model.canCancel}
              onClick={() => void handlers.onCancel?.()}
              type="button"
            >
              Cancel
            </button>
            <button
              disabled={!model.canCopy}
              onClick={() => void handlers.onCopy?.()}
              type="button"
            >
              Copy translation
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
          <p>Translation applied. Undo is available for this composer change.</p>
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
