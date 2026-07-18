import { expect, test } from "@playwright/test";

const extensionId = process.env.WA_TRANSLATOR_EXTENSION_ID;

test("popup shows the compact daily-control structure", async ({ page }) => {
  test.skip(
    !extensionId,
    "Set WA_TRANSLATOR_EXTENSION_ID to run popup browser coverage against a loaded extension."
  );

  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

  await expect(page.getByRole("heading", { name: /daily controls/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /translate current selection/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /open settings/i })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /enable wa translator/i })).toBeVisible();
});
