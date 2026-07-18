import { expect, test } from "@playwright/test";

const extensionId = process.env.WA_TRANSLATOR_EXTENSION_ID;

test.skip(!extensionId, "Set WA_TRANSLATOR_EXTENSION_ID to run extension e2e onboarding coverage.");

test("first-run setup blocks translation until consent and synthetic checks complete", async ({ page }) => {
  await page.goto(`chrome-extension://${extensionId}/src/onboarding/index.html`);

  await expect(page.getByRole("heading", { name: /first-time setup and trust/i })).toBeVisible();
  await page.getByRole("button", { name: /review privacy/i }).click();
  await expect(page.getByRole("heading", { name: /privacy and trust disclosure/i })).toBeVisible();
  await page.getByRole("checkbox", { name: /saya memahami/i }).check();
  await page.getByRole("button", { name: /continue to companion/i }).click();
  await expect(page.getByRole("heading", { name: /local companion readiness/i })).toBeVisible();
  await expect(page.getByText(/synthetic/i)).toBeVisible();
});
