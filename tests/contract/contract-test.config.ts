import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const contractTestConfig = {
  featureDir: resolve(process.cwd(), "specs/001-wa-translator-extension"),
  contractsDir: resolve(process.cwd(), "specs/001-wa-translator-extension/contracts"),
  translationFixturesPath: resolve(process.cwd(), "tests/fixtures/translation/synthetic-messages.json"),
  whatsappFixturesDir: resolve(process.cwd(), "tests/fixtures/whatsapp"),
  translationContractVersion: "1.0",
  nativeMessagingProtocolVersion: "1.0"
} as const;

export const loadSyntheticTranslationFixtures = async (): Promise<unknown> => {
  const content = await readFile(contractTestConfig.translationFixturesPath, "utf8");
  return JSON.parse(content);
};
