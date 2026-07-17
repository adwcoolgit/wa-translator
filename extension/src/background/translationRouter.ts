import { createSanitizedError } from "../domain/errors/sanitizedErrors";
import {
  NATIVE_MESSAGING_PROTOCOL_VERSION,
  nativeErrorMessageSchema,
  nativeHandshakeResultSchema,
  nativeTranslationResponseMessageSchema,
  type InboundNativeHostMessage,
  type NativeErrorMessage,
  type NativeHandshakeResult,
  type NativeTranslationRequestMessage
} from "../shared/contracts/nativeMessaging";
import {
  translationRequestSchema,
  translationResponseSchema,
  type TranslationRequest,
  type TranslationResponse
} from "../shared/contracts/translation";
import { NativeHostPort, createNativeHostPort } from "./nativeHostPort";
import { NATIVE_HOST_APPLICATION_NAME } from "./companionLifecycleService";

type NativeConnectionFactory = (applicationName: string) => NativeHostPort;
type NativeHostListenerCleanup = () => void;

const buildErrorResponse = (
  request: Pick<TranslationRequest, "requestId" | "provider">,
  code:
    | "HOST_NOT_FOUND"
    | "HOST_VERSION_MISMATCH"
    | "PROVIDER_INVALID_OUTPUT"
    | "PROVIDER_TIMEOUT"
    | "HOST_INTEGRITY_FAILED"
): TranslationResponse =>
  translationResponseSchema.parse({
    contractVersion: "1.0",
    requestId: request.requestId,
    status: "error",
    translation: null,
    detectedSourceLanguage: null,
    provider: request.provider,
    latencyMs: 0,
    error: createSanitizedError(code)
  });

const mapBlockedHandshakeToResponse = (
  request: Pick<TranslationRequest, "requestId" | "provider">,
  handshake: NativeHandshakeResult
): TranslationResponse => {
  if (handshake.integrityStatus === "invalid") {
    return buildErrorResponse(request, "HOST_INTEGRITY_FAILED");
  }

  if (handshake.extensionIdAllowlistStatus === "invalid") {
    return buildErrorResponse(request, "HOST_VERSION_MISMATCH");
  }

  return buildErrorResponse(request, "HOST_VERSION_MISMATCH");
};

const waitForMessage = <
  TMessage extends InboundNativeHostMessage | NativeErrorMessage
>(
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

export class TranslationRouter {
  public constructor(
    private readonly createPort: NativeConnectionFactory = createNativeHostPort,
    private readonly applicationName = NATIVE_HOST_APPLICATION_NAME,
    private readonly extensionVersion = chrome.runtime?.getManifest?.().version ?? "0.0.0-dev",
    private readonly extensionId = chrome.runtime?.id ?? "development-extension"
  ) {}

  public async translate(message: NativeTranslationRequestMessage): Promise<TranslationResponse> {
    const payload = translationRequestSchema.parse(message.payload);
    let port: NativeHostPort | null = null;

    try {
      port = this.createPort(this.applicationName);
      const handshake = await this.performHandshake(port);

      if (handshake.status === "blocked") {
        return mapBlockedHandshakeToResponse(payload, handshake);
      }

      const responsePromise = waitForMessage(
        port,
        (
          inboundMessage
        ): inboundMessage is ReturnType<typeof nativeTranslationResponseMessageSchema.parse> | NativeErrorMessage =>
          inboundMessage.type === "translationResponse" || inboundMessage.type === "error"
      );

      port.postMessage({
        type: "translationRequest",
        protocolVersion: NATIVE_MESSAGING_PROTOCOL_VERSION,
        payload
      });

      const nativeResponse = await responsePromise;
      if (nativeResponse.type === "error") {
        nativeErrorMessageSchema.parse(nativeResponse);
        return buildErrorResponse(payload, "PROVIDER_INVALID_OUTPUT");
      }

      const parsedResponse = nativeTranslationResponseMessageSchema.parse(nativeResponse);
      if (parsedResponse.payload.requestId !== payload.requestId) {
        return buildErrorResponse(payload, "PROVIDER_INVALID_OUTPUT");
      }

      return translationResponseSchema.parse(parsedResponse.payload);
    } catch (error) {
      const messageText = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (messageText.includes("native messaging host") && messageText.includes("not found")) {
        return buildErrorResponse(payload, "HOST_NOT_FOUND");
      }

      if (messageText.includes("timed out") || messageText.includes("timeout")) {
        return buildErrorResponse(payload, "PROVIDER_TIMEOUT");
      }

      return buildErrorResponse(payload, "PROVIDER_INVALID_OUTPUT");
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

export const buildNativeTranslationRequestMessage = (
  request: TranslationRequest
): NativeTranslationRequestMessage => ({
  type: "translationRequest",
  protocolVersion: NATIVE_MESSAGING_PROTOCOL_VERSION,
  payload: translationRequestSchema.parse(request)
});

export const createTranslationRouter = (
  createPort?: NativeConnectionFactory,
  applicationName?: string
): TranslationRouter => new TranslationRouter(createPort, applicationName);
