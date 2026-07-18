import { createSanitizedError } from "../domain/errors/sanitizedErrors";
import {
  createUnknownProviderHealth,
  normalizeProviderHealthState,
  providerHealthSchema,
  type ProviderHealth
} from "../domain/provider/providerHealth";
import type { UserSettings } from "../domain/settings/userSettings";
import { NativeHostPort, createNativeHostPort } from "./nativeHostPort";
import {
  NATIVE_MESSAGING_PROTOCOL_VERSION,
  nativeHandshakeResultSchema,
  nativeLifecycleResultSchema,
  nativeProviderHealthCheckResultMessageSchema,
  type InboundNativeHostMessage,
  type NativeHandshakeResult,
  type NativeLifecycleResult,
  type NativeProviderHealthCheckResultMessage
} from "../shared/contracts/nativeMessaging";
import type { ProviderId } from "../shared/contracts/translation";

export const NATIVE_HOST_APPLICATION_NAME = "com.wa_translator.host";
export const SYNTHETIC_HEALTH_CHECK_TEXT =
  "WA Translator synthetic health check. Do not use WhatsApp chat content.";

type NativeConnectionFactory = (applicationName: string) => NativeHostPort;
type NativeHostListenerCleanup = () => void;

const buildRequestId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const buildSyntheticHealthCheckMessage = (
  provider: ProviderId,
    settings: Pick<UserSettings, "sourceLanguage" | "targetLanguage" | "providerTimeoutSeconds" | "providerExecutablePathOverride">
) => ({
  type: "providerHealthCheckRequest" as const,
  protocolVersion: NATIVE_MESSAGING_PROTOCOL_VERSION,
  payload: {
    requestId: buildRequestId(`health-${provider}`),
    provider,
    syntheticText: SYNTHETIC_HEALTH_CHECK_TEXT,
    sourceLanguage: settings.sourceLanguage,
    targetLanguage: settings.targetLanguage,
    executablePathOverride: settings.providerExecutablePathOverride,
    timeoutSeconds: settings.providerTimeoutSeconds
  }
});

const mapBlockedHandshakeToLifecycle = (
  handshake: NativeHandshakeResult
): NativeLifecycleResult => {
  if (handshake.integrityStatus === "invalid") {
    return nativeLifecycleResultSchema.parse({
      type: "lifecycleResult",
      state: "integrityFailed",
      hostVersion: handshake.hostVersion,
      protocolVersion: handshake.protocolVersion,
      extensionIdAllowlistStatus: handshake.extensionIdAllowlistStatus,
      integrityStatus: handshake.integrityStatus,
      recoveryAction: "updateCompanion"
    });
  }

  if (handshake.extensionIdAllowlistStatus === "invalid") {
    return nativeLifecycleResultSchema.parse({
      type: "lifecycleResult",
      state: "registrationFailed",
      hostVersion: handshake.hostVersion,
      protocolVersion: handshake.protocolVersion,
      extensionIdAllowlistStatus: handshake.extensionIdAllowlistStatus,
      integrityStatus: handshake.integrityStatus,
      recoveryAction: "installCompanion"
    });
  }

  return nativeLifecycleResultSchema.parse({
    type: "lifecycleResult",
    state: "incompatible",
    hostVersion: handshake.hostVersion,
    protocolVersion: handshake.protocolVersion,
    extensionIdAllowlistStatus: handshake.extensionIdAllowlistStatus,
    integrityStatus: handshake.integrityStatus,
    recoveryAction: "updateCompanion"
  });
};

export const createLifecycleResultForConnectionError = (
  error: unknown
): NativeLifecycleResult => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("native messaging host") && message.includes("not found")) {
    return nativeLifecycleResultSchema.parse({
      type: "lifecycleResult",
      state: "notDetected",
      hostVersion: null,
      protocolVersion: null,
      extensionIdAllowlistStatus: "unknown",
      integrityStatus: "unknown",
      recoveryAction: "installCompanion"
    });
  }

  if (message.includes("permission")) {
    return nativeLifecycleResultSchema.parse({
      type: "lifecycleResult",
      state: "permissionIssue",
      hostVersion: null,
      protocolVersion: null,
      extensionIdAllowlistStatus: "unknown",
      integrityStatus: "unknown",
      recoveryAction: "retry"
    });
  }

  return nativeLifecycleResultSchema.parse({
    type: "lifecycleResult",
    state: "registrationFailed",
    hostVersion: null,
    protocolVersion: null,
    extensionIdAllowlistStatus: "unknown",
    integrityStatus: "unknown",
    recoveryAction: "installCompanion"
  });
};

const mapLifecycleToProviderHealth = (
  provider: ProviderId,
  lifecycle: NativeLifecycleResult
): ProviderHealth => {
  switch (lifecycle.state) {
    case "notDetected":
      return normalizeProviderHealthState({
        provider,
        outcome: "missing",
        error: createSanitizedError("HOST_NOT_FOUND")
      });
    case "incompatible":
      return normalizeProviderHealthState({
        provider,
        outcome: "versionMismatch",
        versionCategory: lifecycle.hostVersion,
        error: createSanitizedError("HOST_VERSION_MISMATCH")
      });
    case "integrityFailed":
      return normalizeProviderHealthState({
        provider,
        outcome: "unsafeConfiguration",
        error: createSanitizedError("HOST_INTEGRITY_FAILED")
      });
    default:
      return normalizeProviderHealthState({
        provider,
        outcome: "unavailable",
        versionCategory: lifecycle.hostVersion,
        error: createSanitizedError("HOST_NOT_FOUND")
      });
  }
};

export const mapHealthCheckResponseToProviderHealth = (
  response: NativeProviderHealthCheckResultMessage
): ProviderHealth => {
  const parsed = nativeProviderHealthCheckResultMessageSchema.parse(response);
  const payload = parsed.payload;

  if (payload.status === "success") {
    return providerHealthSchema.parse(
      normalizeProviderHealthState({
        provider: payload.provider,
        outcome: "ready",
        latencyMs: payload.latencyMs,
        versionCategory: "synthetic-translation-ok"
      })
    );
  }

  const errorCode = payload.error?.code;

  if (errorCode === "PROVIDER_AUTH_REQUIRED") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "authRequired",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  if (errorCode === "PROVIDER_TIMEOUT") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "timeout",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  if (errorCode === "PROVIDER_RATE_LIMIT") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "rateLimited",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  if (errorCode === "PROVIDER_UNSAFE_CONFIGURATION") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "unsafeConfiguration",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  if (errorCode === "HOST_VERSION_MISMATCH") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "versionMismatch",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  if (errorCode === "PROVIDER_NOT_FOUND") {
    return normalizeProviderHealthState({
      provider: payload.provider,
      outcome: "missing",
      latencyMs: payload.latencyMs,
      error: payload.error
    });
  }

  return normalizeProviderHealthState({
    provider: payload.provider,
    outcome: "invalidOutput",
    latencyMs: payload.latencyMs,
    error: payload.error ?? createSanitizedError("PROVIDER_INVALID_OUTPUT")
  });
};

const waitForMessage = <TMessage extends InboundNativeHostMessage>(
  port: NativeHostPort,
  predicate: (message: InboundNativeHostMessage) => message is TMessage
): Promise<TMessage> =>
  new Promise<TMessage>((resolve, reject) => {
    let cleanupMessage: NativeHostListenerCleanup | null = null;
    let cleanupDisconnect: NativeHostListenerCleanup | null = null;

    const cleanup = (): void => {
      cleanupMessage?.();
      cleanupDisconnect?.();
      cleanupMessage = null;
      cleanupDisconnect = null;
    };

    cleanupMessage = port.onMessage((message) => {
      if (!predicate(message)) {
        return;
      }

      cleanup();
      resolve(message);
    });

    cleanupDisconnect = port.onDisconnect(() => {
      cleanup();
      reject(new Error("Native host disconnected before responding."));
    });
  });

export class CompanionLifecycleService {
  public constructor(
    private readonly createPort: NativeConnectionFactory = createNativeHostPort,
    private readonly applicationName = NATIVE_HOST_APPLICATION_NAME,
    private readonly extensionVersion = chrome.runtime?.getManifest?.().version ?? "0.0.0-dev",
    private readonly extensionId = chrome.runtime?.id ?? "development-extension"
  ) {}

  public async queryLifecycle(): Promise<NativeLifecycleResult> {
    let port: NativeHostPort | null = null;

    try {
      port = this.createPort(this.applicationName);
      const handshake = await this.performHandshake(port);

      if (handshake.status === "blocked") {
        return mapBlockedHandshakeToLifecycle(handshake);
      }

      const lifecycleResultPromise = waitForMessage(
        port,
        (message): message is NativeLifecycleResult => message.type === "lifecycleResult"
      );

      port.postMessage({ type: "lifecycleQuery" });
      return nativeLifecycleResultSchema.parse(await lifecycleResultPromise);
    } catch (error) {
      return createLifecycleResultForConnectionError(error);
    } finally {
      port?.disconnect();
    }
  }

  public async runSyntheticProviderHealthCheck(
    provider: ProviderId,
    settings: Pick<UserSettings, "sourceLanguage" | "targetLanguage" | "providerTimeoutSeconds" | "providerExecutablePathOverride">
  ): Promise<ProviderHealth> {
    const lifecycle = await this.queryLifecycle();
    if (lifecycle.state !== "ready") {
      return mapLifecycleToProviderHealth(provider, lifecycle);
    }

    let port: NativeHostPort | null = null;

    try {
      port = this.createPort(this.applicationName);
      const handshake = await this.performHandshake(port);
      if (handshake.status === "blocked") {
        return mapLifecycleToProviderHealth(provider, mapBlockedHandshakeToLifecycle(handshake));
      }

      const healthCheckMessage = buildSyntheticHealthCheckMessage(provider, settings);
      const responsePromise = waitForMessage(
        port,
        (message): message is NativeProviderHealthCheckResultMessage =>
          message.type === "providerHealthCheckResult"
      );

      port.postMessage(healthCheckMessage);
      return mapHealthCheckResponseToProviderHealth(await responsePromise);
    } catch {
      return providerHealthSchema.parse({
        ...createUnknownProviderHealth(provider),
        state: "unavailable",
        lastCheckedAt: Date.now(),
        lastSanitizedError: createSanitizedError("HOST_NOT_FOUND")
      });
    } finally {
      port?.disconnect();
    }
  }

  private async performHandshake(port: NativeHostPort): Promise<NativeHandshakeResult> {
    const handshakePromise = waitForMessage(
      port,
      (message): message is NativeHandshakeResult => message.type === "handshakeResult"
    );

    port.postMessage({
      type: "handshake",
      extensionId: this.extensionId,
      extensionVersion: this.extensionVersion,
      protocolVersion: NATIVE_MESSAGING_PROTOCOL_VERSION
    });

    return nativeHandshakeResultSchema.parse(await handshakePromise);
  }
}

export const createCompanionLifecycleService = (
  createPort?: NativeConnectionFactory,
  applicationName?: string
): CompanionLifecycleService => new CompanionLifecycleService(createPort, applicationName);


