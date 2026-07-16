import {
  inboundNativeHostMessageSchema,
  outboundNativeHostMessageSchema,
  type InboundNativeHostMessage,
  type OutboundNativeHostMessage
} from "../shared/contracts/nativeMessaging";

export class NativeHostPort {
  private readonly port: chrome.runtime.Port;

  public constructor(applicationName: string) {
    if (typeof chrome === "undefined" || !chrome.runtime?.connectNative) {
      throw new Error("chrome.runtime.connectNative is not available in this environment");
    }

    this.port = chrome.runtime.connectNative(applicationName);
  }

  public postMessage(message: OutboundNativeHostMessage): void {
    this.port.postMessage(outboundNativeHostMessageSchema.parse(message));
  }

  public onMessage(listener: (message: InboundNativeHostMessage) => void): () => void {
    const wrappedListener = (message: unknown): void => {
      listener(inboundNativeHostMessageSchema.parse(message));
    };

    this.port.onMessage.addListener(wrappedListener);
    return () => this.port.onMessage.removeListener(wrappedListener);
  }

  public onDisconnect(listener: () => void): () => void {
    this.port.onDisconnect.addListener(listener);
    return () => this.port.onDisconnect.removeListener(listener);
  }

  public disconnect(): void {
    this.port.disconnect();
  }
}

export const createNativeHostPort = (applicationName: string): NativeHostPort =>
  new NativeHostPort(applicationName);
