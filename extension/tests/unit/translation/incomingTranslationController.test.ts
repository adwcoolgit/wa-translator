import { describe, expect, it } from "vitest";

import { shouldDiscardIncomingTranslationResult } from "../../../src/content/translation/incomingTranslationController";

describe("shouldDiscardIncomingTranslationResult", () => {
  it("discards results when the active chat scope changes", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-b",
        anchorValidity: "valid"
      })
    ).toBe(true);
  });

  it("discards results when the anchor is no longer valid", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-a",
        anchorValidity: "missing"
      })
    ).toBe(true);
  });

  it("keeps results only when the same chat is active and the anchor remains valid", () => {
    expect(
      shouldDiscardIncomingTranslationResult({
        requestChatScope: "chat-a",
        activeChatScope: "chat-a",
        anchorValidity: "valid"
      })
    ).toBe(false);
  });
});
