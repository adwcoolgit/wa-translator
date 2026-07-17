import React from "react";

import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import type { RecoveryAction, SanitizedError } from "../contracts/diagnostics";
import { sanitizedErrorCodeSchema } from "../contracts/diagnostics";
import type { SanitizedTranslationError } from "../contracts/translation";
import { presentRecoverableError } from "../errors/recoverableErrorPresenter";

export interface RecoveryActionPanelProps {
  error: SanitizedError | SanitizedTranslationError;
  onAction?: (action: RecoveryAction) => void;
  actionBusy?: boolean;
  compact?: boolean;
}

const toRecoverableError = (error: SanitizedError | SanitizedTranslationError): SanitizedError => {
  const parsedCode = sanitizedErrorCodeSchema.safeParse(error.code);
  return parsedCode.success ? createSanitizedError(parsedCode.data) : createSanitizedError("PROVIDER_INVALID_OUTPUT");
};

export function RecoveryActionPanel({
  error,
  onAction,
  actionBusy = false,
  compact = false
}: RecoveryActionPanelProps) {
  const normalizedError = toRecoverableError(error);
  const presentation = presentRecoverableError(normalizedError);

  return (
    <section
      aria-label="Recovery actions"
      className={compact ? "wa-translator-recovery-panel compact" : "wa-translator-recovery-panel"}
      data-error-code={normalizedError.code}
      data-surface="recovery-actions"
    >
      <p>{presentation.severityLabel}</p>
      <h2>{presentation.title}</h2>
      <p>{presentation.body}</p>
      <p>Support code: {presentation.supportCode}</p>
      <div>
        <button
          disabled={actionBusy}
          onClick={() => {
            onAction?.(presentation.primaryAction.action);
          }}
          type="button"
        >
          {presentation.primaryAction.label}
        </button>
        {presentation.secondaryAction ? (
          <button
            disabled={actionBusy}
            onClick={() => {
              onAction?.(presentation.secondaryAction!.action);
            }}
            type="button"
          >
            {presentation.secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}