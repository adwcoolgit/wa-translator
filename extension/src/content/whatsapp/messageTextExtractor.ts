import type { MessageFingerprint } from "../../domain/translation/sessionCache";

export const CHAT_THREAD_SELECTOR = '[data-testid="chat-thread"]';
export const RECEIVED_MESSAGE_SELECTOR = '[data-testid="message received"]';
export const MESSAGE_TEXT_SELECTOR = '[data-testid="message-text"]';

export interface ExtractedReceivedMessage {
  messageId: string;
  chatScope: string;
  sourceText: string;
  normalizedTextSignal: string;
  structuralSignal: string;
  timeSignal: string | null;
  senderScope: string | null;
  messageElement: HTMLElement;
}

export const normalizeVisibleMessageText = (value: string): string =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1)
    .join("\n")
    .trim();

export const resolveActiveChatScope = (root: ParentNode): string => {
  const rootElement = root instanceof Document ? root.body : root;
  const thread = rootElement.querySelector?.(CHAT_THREAD_SELECTOR) as HTMLElement | null;
  return thread?.dataset.chatScope?.trim() || "active-chat";
};

export const extractVisibleMessageText = (messageElement: Element): string | null => {
  const textElement = messageElement.querySelector(MESSAGE_TEXT_SELECTOR);
  if (!textElement) {
    return null;
  }

  const normalizedText = normalizeVisibleMessageText(textElement.textContent ?? "");
  return normalizedText.length > 0 ? normalizedText : null;
};

export const extractReceivedMessage = (
  messageElement: Element,
  root: ParentNode = messageElement.ownerDocument ?? document
): ExtractedReceivedMessage | null => {
  if (!(messageElement instanceof HTMLElement)) {
    return null;
  }

  const sourceText = extractVisibleMessageText(messageElement);
  if (!sourceText) {
    return null;
  }

  const messageId = messageElement.dataset.messageId?.trim() || `message-${sourceText.length}`;
  const chatScope = resolveActiveChatScope(root);

  return {
    messageId,
    chatScope,
    sourceText,
    normalizedTextSignal: sourceText,
    structuralSignal: `${chatScope}:${messageId}`,
    timeSignal: messageElement.dataset.timestamp?.trim() || null,
    senderScope: messageElement.dataset.senderScope?.trim() || null,
    messageElement
  };
};

export const collectReceivedMessages = (root: ParentNode = document): ExtractedReceivedMessage[] => {
  const rootElement = root instanceof Document ? root.body : root;
  const receivedMessages = rootElement.querySelectorAll?.(RECEIVED_MESSAGE_SELECTOR) ?? [];
  const collected: ExtractedReceivedMessage[] = [];

  for (const receivedMessage of receivedMessages) {
    const extracted = extractReceivedMessage(receivedMessage, root);
    if (extracted) {
      collected.push(extracted);
    }
  }

  return collected;
};

export const createFingerprintMetadataForMessage = (
  message: Pick<ExtractedReceivedMessage, "chatScope" | "normalizedTextSignal" | "structuralSignal" | "timeSignal" | "senderScope">
): Pick<MessageFingerprint, "chatScope" | "normalizedTextSignal" | "structuralSignal" | "timeSignal" | "senderScope"> => ({
  chatScope: message.chatScope,
  normalizedTextSignal: message.normalizedTextSignal,
  structuralSignal: message.structuralSignal,
  timeSignal: message.timeSignal,
  senderScope: message.senderScope
});
