import {
  createMessageFingerprint,
  type MessageFingerprint
} from "./sessionCache";

export const normalizeTextSignal = (value: string): string =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n")
    .trim();

export class MessageFingerprintService {
  private readonly fingerprints = new Map<string, number>();

  public register(fingerprint: MessageFingerprint, now = Date.now()): boolean {
    this.clearExpired(now);

    const existingExpiry = this.fingerprints.get(fingerprint.fingerprintId);
    if (typeof existingExpiry === "number" && existingExpiry > now) {
      return false;
    }

    this.fingerprints.set(fingerprint.fingerprintId, fingerprint.expiresAt);
    return true;
  }

  public has(fingerprintId: string, now = Date.now()): boolean {
    this.clearExpired(now);
    const expiresAt = this.fingerprints.get(fingerprintId);
    return typeof expiresAt === "number" && expiresAt > now;
  }

  public clearExpired(now = Date.now()): void {
    for (const [fingerprintId, expiresAt] of this.fingerprints.entries()) {
      if (expiresAt <= now) {
        this.fingerprints.delete(fingerprintId);
      }
    }
  }

  public reset(): void {
    this.fingerprints.clear();
  }
}

export const buildIncomingMessageFingerprint = (input: {
  chatScope: string;
  normalizedTextSignal: string;
  structuralSignal: string;
  timeSignal?: string | null;
  adapterVersion: string;
  senderScope?: string | null;
  now?: number;
}): MessageFingerprint =>
  createMessageFingerprint({
    chatScope: input.chatScope,
    direction: "received",
    senderScope: input.senderScope ?? null,
    normalizedTextSignal: normalizeTextSignal(input.normalizedTextSignal),
    structuralSignal: input.structuralSignal,
    timeSignal: input.timeSignal ?? null,
    quotedState: "none",
    adapterVersion: input.adapterVersion,
    now: input.now
  });

export const createMessageFingerprintService = (): MessageFingerprintService =>
  new MessageFingerprintService();
