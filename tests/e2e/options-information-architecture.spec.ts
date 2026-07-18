import { expect, test } from "@playwright/test";

const extensionId = process.env.WA_TRANSLATOR_EXTENSION_ID;

test.skip(!extensionId, "Set WA_TRANSLATOR_EXTENSION_ID to run extension e2e options coverage.");

test("options navigation keeps grouped settings surfaces documented", async ({ page }) => {
  await page.goto(`chrome-extension://${extensionId}/src/options/index.html#general`);

  await expect(page.getByRole("heading", { name: /wa translator settings/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^general$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^translation$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /ai provider/i })).toBeVisible();

  await page.getByRole("button", { name: /^translation$/i }).click();
  await expect(page.getByRole("heading", { name: /^translation$/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /search target languages/i })).toBeVisible();

  await page.getByRole("button", { name: /^general$/i }).click();
  await page.getByRole("button", { name: /clear local data/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
