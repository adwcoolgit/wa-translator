import type {
  RecoveryAction,
  SanitizedError,
  SanitizedErrorCode,
  SanitizedErrorSeverity
} from "../contracts/diagnostics";

export interface RecoveryActionDescriptor {
  action: RecoveryAction;
  label: string;
}

export interface RecoverableErrorPresentation {
  title: string;
  body: string;
  severityLabel: string;
  supportCode: string;
  primaryAction: RecoveryActionDescriptor;
  secondaryAction: RecoveryActionDescriptor | null;
}

export type ValidationMessageId =
  | "invalidProviderOverride"
  | "missingCustomStyleName"
  | "missingCustomStyleInstruction"
  | "pendingUnsavedChanges"
  | "confirmClearLocalData"
  | "confirmResetSettings";

export interface ValidationMessagePresentation {
  title: string;
  body: string;
  severityLabel: string;
  suggestedActionLabel: string | null;
}

const severityLabels: Record<SanitizedErrorSeverity, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
  blocking: "Needs attention"
};

export const recoveryActionLabels: Record<RecoveryAction, string> = {
  retry: "Retry",
  openDiagnostics: "Open diagnostics",
  installCompanion: "Install companion",
  updateCompanion: "Update companion",
  signInWithCli: "Sign in with CLI",
  selectExecutable: "Select executable",
  openShortcutSettings: "Open shortcut settings",
  copyResult: "Copy result",
  returnToChat: "Return to chat",
  dismiss: "Dismiss"
};

type CatalogEntry = {
  title: string;
  body: string;
  primaryAction: RecoveryAction;
  secondaryAction?: RecoveryAction | null;
};

const errorPresentationCatalog: Record<SanitizedErrorCode, CatalogEntry> = {
  HOST_NOT_FOUND: {
    title: "Local companion is missing",
    body: "Install the Windows companion before starting translations from WhatsApp Web.",
    primaryAction: "installCompanion",
    secondaryAction: "openDiagnostics"
  },
  HOST_VERSION_MISMATCH: {
    title: "Local companion needs an update",
    body: "The extension and local companion are out of sync. Update the companion, then retry.",
    primaryAction: "updateCompanion",
    secondaryAction: "openDiagnostics"
  },
  PROVIDER_NOT_FOUND: {
    title: "Provider executable was not found",
    body: "Select a supported CLI executable so WA Translator can send translation requests safely.",
    primaryAction: "selectExecutable",
    secondaryAction: "openDiagnostics"
  },
  PROVIDER_AUTH_REQUIRED: {
    title: "Provider sign-in is required",
    body: "Complete the CLI sign-in flow for the active provider, then retry the request.",
    primaryAction: "signInWithCli",
    secondaryAction: "openDiagnostics"
  },
  PROVIDER_TIMEOUT: {
    title: "Translation timed out",
    body: "The provider took too long to respond. Retry, or review diagnostics if the delay keeps happening.",
    primaryAction: "retry",
    secondaryAction: "openDiagnostics"
  },
  PROVIDER_RATE_LIMIT: {
    title: "Provider usage limit reached",
    body: "The active provider rejected the request because of a temporary usage limit. Retry after a short wait.",
    primaryAction: "retry",
    secondaryAction: "openDiagnostics"
  },
  PROVIDER_INVALID_OUTPUT: {
    title: "Provider response could not be used",
    body: "WA Translator rejected the provider output because it did not match the safe translation contract.",
    primaryAction: "openDiagnostics",
    secondaryAction: "retry"
  },
  INPUT_TOO_LARGE: {
    title: "Selected text is too large",
    body: "Reduce the amount of text before sending it to the provider.",
    primaryAction: "dismiss",
    secondaryAction: "returnToChat"
  },
  DOM_ADAPTER_INCOMPATIBLE: {
    title: "Automatic translation is paused",
    body: "WhatsApp Web changed enough that the current DOM adapter is no longer safe to use automatically.",
    primaryAction: "openDiagnostics",
    secondaryAction: "returnToChat"
  },
  SELECTION_NOT_FOUND: {
    title: "Selection is no longer available",
    body: "The selected text changed before translation finished. Re-select the text and retry.",
    primaryAction: "dismiss",
    secondaryAction: "returnToChat"
  },
  INSERTION_FAILED: {
    title: "WA Translator could not insert the result",
    body: "The translation is available, but the composer or selected target changed before insertion completed.",
    primaryAction: "copyResult",
    secondaryAction: "returnToChat"
  },
  CANCELLED: {
    title: "Translation was cancelled",
    body: "No content was sent further. You can return to chat and start a new translation when ready.",
    primaryAction: "dismiss",
    secondaryAction: "returnToChat"
  },
  ONBOARDING_REQUIRED: {
    title: "Setup is still required",
    body: "Complete the privacy disclosure, companion checks, and provider validation before translating.",
    primaryAction: "dismiss",
    secondaryAction: "openDiagnostics"
  },
  QUEUE_OVERFLOW: {
    title: "Too many translations are queued",
    body: "WA Translator dropped this request to avoid stale or misleading results. Retry when the queue is calmer.",
    primaryAction: "retry",
    secondaryAction: "openDiagnostics"
  },
  STALE_REQUEST_DISCARDED: {
    title: "This result is no longer current",
    body: "The chat or message changed before the request completed, so the old result was discarded safely.",
    primaryAction: "retry",
    secondaryAction: "returnToChat"
  },
  PROVIDER_UNSAFE_CONFIGURATION: {
    title: "Provider configuration is not safe",
    body: "The local provider environment rejected the request or exposed an unsafe execution state.",
    primaryAction: "openDiagnostics",
    secondaryAction: "selectExecutable"
  },
  HOST_INTEGRITY_FAILED: {
    title: "Companion integrity check failed",
    body: "WA Translator could not confirm the local companion matches the expected installation state.",
    primaryAction: "updateCompanion",
    secondaryAction: "openDiagnostics"
  }
};

const validationMessageCatalog: Record<ValidationMessageId, ValidationMessagePresentation> = {
  invalidProviderOverride: {
    title: "Provider override path needs attention",
    body: "Choose a valid executable path before saving provider changes.",
    severityLabel: "Needs attention",
    suggestedActionLabel: "Select executable"
  },
  missingCustomStyleName: {
    title: "Custom style name is missing",
    body: "Name the custom style so the tone can be understood before it is reused.",
    severityLabel: "Warning",
    suggestedActionLabel: "Review custom style"
  },
  missingCustomStyleInstruction: {
    title: "Custom style instruction is missing",
    body: "Add the instruction text before the custom style can be saved safely.",
    severityLabel: "Warning",
    suggestedActionLabel: "Review custom style"
  },
  pendingUnsavedChanges: {
    title: "There are pending settings changes",
    body: "Save or cancel the current edits before leaving the section so the final state stays clear.",
    severityLabel: "Warning",
    suggestedActionLabel: "Save changes"
  },
  confirmClearLocalData: {
    title: "Clearing local data needs explicit confirmation",
    body: "Review the impact summary before session-only cache and diagnostics are removed.",
    severityLabel: "Needs attention",
    suggestedActionLabel: "Review impact"
  },
  confirmResetSettings: {
    title: "Resetting settings needs explicit confirmation",
    body: "Review the impact summary before saved defaults and local operational data are reset.",
    severityLabel: "Needs attention",
    suggestedActionLabel: "Review impact"
  }
};

export const presentRecoverableError = (
  error: SanitizedError
): RecoverableErrorPresentation => {
  const presentation = errorPresentationCatalog[error.code];

  return {
    title: presentation.title,
    body: presentation.body,
    severityLabel: severityLabels[error.severity],
    supportCode: error.supportCode,
    primaryAction: {
      action: presentation.primaryAction,
      label: recoveryActionLabels[presentation.primaryAction]
    },
    secondaryAction: presentation.secondaryAction
      ? {
          action: presentation.secondaryAction,
          label: recoveryActionLabels[presentation.secondaryAction]
        }
      : null
  };
};

export const presentValidationMessage = (
  validationMessageId: ValidationMessageId
): ValidationMessagePresentation => validationMessageCatalog[validationMessageId];
