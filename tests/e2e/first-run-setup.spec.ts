import { expect, test } from "@playwright/test";

test("first-run setup blocks translation until consent and synthetic checks complete", async ({ page }) => {
  await page.goto("chrome-extension://__WA_TRANSLATOR_ID__/src/onboarding/index.html");

  await expect(page.getByRole("heading", { name: /first-time setup and trust/i })).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /privacy and trust disclosure/i })).toBeVisible();
  await page.getByRole("checkbox", { name: /saya memahami/i }).check();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /local companion readiness/i })).toBeVisible();
  await expect(page.getByText(/synthetic/i)).toBeVisible();
});

