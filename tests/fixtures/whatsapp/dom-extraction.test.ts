// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { collectReceivedMessages } from "../../../extension/src/content/whatsapp/messageTextExtractor";

const fixturePath = resolve(process.cwd(), "..", "tests/fixtures/whatsapp/received-messages.html");

describe("WhatsApp DOM extraction fixture", () => {
  it("extracts visible received message text only and excludes metadata", () => {
    const documentHtml = readFileSync(fixturePath, "utf8");
    document.body.innerHTML = documentHtml;

    const extractedMessages = collectReceivedMessages(document);

    expect(extractedMessages).toHaveLength(2);
    expect(extractedMessages[0]?.sourceText).toBe("Hello Andri, invoice INV-9901 is ready ??");
    expect(extractedMessages[0]?.sourceText).not.toContain("09:30");
    expect(extractedMessages[1]?.sourceText).toBe("Please keep https://contoh.test exactly as-is.");
  });
});
