import {
  recoveryActionSchema,
  sanitizedErrorCodeSchema,
  sanitizedErrorComponentSchema,
  sanitizedErrorSchema,
  sanitizedErrorSeveritySchema,
  type RecoveryAction,
  type SanitizedError,
  type SanitizedErrorCode,
  type SanitizedErrorComponent,
  type SanitizedErrorSeverity
} from "../../shared/contracts/diagnostics";

export const sanitizedErrorCatalog: Record<
  SanitizedErrorCode,
  {
    component: SanitizedErrorComponent;
    severity: SanitizedErrorSeverity;
    recoveryAction: RecoveryAction;
    supportCode: string;
    messageKey: string;
  }
> = {
  HOST_NOT_FOUND: {
    component: "nativeHost",
    severity: "blocking",
    recoveryAction: "installCompanion",
    supportCode: "HOST_NOT_FOUND",
    messageKey: "host.notFound"
  },
  HOST_VERSION_MISMATCH: {
    component: "nativeHost",
    severity: "blocking",
    recoveryAction: "updateCompanion",
    supportCode: "HOST_VERSION_MISMATCH",
    messageKey: "host.versionMismatch"
  },
  PROVIDER_NOT_FOUND: {
    component: "provider",
    severity: "blocking",
    recoveryAction: "selectExecutable",
    supportCode: "PROVIDER_NOT_FOUND",
    messageKey: "provider.notFound"
  },
  PROVIDER_AUTH_REQUIRED: {
    component: "provider",
    severity: "warning",
    recoveryAction: "signInWithCli",
    supportCode: "PROVIDER_AUTH_REQUIRED",
    messageKey: "provider.authRequired"
  },
  PROVIDER_TIMEOUT: {
    component: "provider",
    severity: "warning",
    recoveryAction: "retry",
    supportCode: "PROVIDER_TIMEOUT",
    messageKey: "provider.timeout"
  },
  PROVIDER_RATE_LIMIT: {
    component: "provider",
    severity: "warning",
    recoveryAction: "retry",
    supportCode: "PROVIDER_RATE_LIMIT",
    messageKey: "provider.rateLimit"
  },
  PROVIDER_INVALID_OUTPUT: {
    component: "provider",
    severity: "error",
    recoveryAction: "openDiagnostics",
    supportCode: "PROVIDER_INVALID_OUTPUT",
    messageKey: "provider.invalidOutput"
  },
  INPUT_TOO_LARGE: {
    component: "extension",
    severity: "warning",
    recoveryAction: "dismiss",
    supportCode: "INPUT_TOO_LARGE",
    messageKey: "input.tooLarge"
  },
  DOM_ADAPTER_INCOMPATIBLE: {
    component: "contentAdapter",
    severity: "blocking",
    recoveryAction: "openDiagnostics",
    supportCode: "DOM_ADAPTER_INCOMPATIBLE",
    messageKey: "dom.incompatible"
  },
  SELECTION_NOT_FOUND: {
    component: "contentAdapter",
    severity: "warning",
    recoveryAction: "dismiss",
    supportCode: "SELECTION_NOT_FOUND",
    messageKey: "selection.notFound"
  },
  INSERTION_FAILED: {
    component: "contentAdapter",
    severity: "warning",
    recoveryAction: "copyResult",
    supportCode: "INSERTION_FAILED",
    messageKey: "manual.insertionFailed"
  },
  CANCELLED: {
    component: "extension",
    severity: "info",
    recoveryAction: "dismiss",
    supportCode: "CANCELLED",
    messageKey: "request.cancelled"
  },
  QUEUE_OVERFLOW: {
    component: "extension",
    severity: "warning",
    recoveryAction: "retry",
    supportCode: "QUEUE_OVERFLOW",
    messageKey: "queue.overflow"
  },
  STALE_REQUEST_DISCARDED: {
    component: "extension",
    severity: "info",
    recoveryAction: "retry",
    supportCode: "STALE_REQUEST_DISCARDED",
    messageKey: "request.stale"
  },
  PROVIDER_UNSAFE_CONFIGURATION: {
    component: "provider",
    severity: "blocking",
    recoveryAction: "openDiagnostics",
    supportCode: "PROVIDER_UNSAFE_CONFIGURATION",
    messageKey: "provider.unsafeConfiguration"
  },
  HOST_INTEGRITY_FAILED: {
    component: "installer",
    severity: "blocking",
    recoveryAction: "updateCompanion",
    supportCode: "HOST_INTEGRITY_FAILED",
    messageKey: "host.integrityFailed"
  }
};

export const createSanitizedError = (code: SanitizedErrorCode): SanitizedError => {
  const definition = sanitizedErrorCatalog[sanitizedErrorCodeSchema.parse(code)];

  return sanitizedErrorSchema.parse({
    code,
    component: sanitizedErrorComponentSchema.parse(definition.component),
    severity: sanitizedErrorSeveritySchema.parse(definition.severity),
    recoveryAction: recoveryActionSchema.parse(definition.recoveryAction),
    supportCode: definition.supportCode
  });
};

export const getRecoveryActionForError = (code: SanitizedErrorCode): RecoveryAction =>
  sanitizedErrorCatalog[sanitizedErrorCodeSchema.parse(code)].recoveryAction;
