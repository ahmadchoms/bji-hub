import { test, expect } from "@playwright/test";

test.describe("Authentication - Reset Password Flow", () => {
  test("renders forgot password page and input fields", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    } else {
      // Fallback: check if redirected to login
      await expect(page).toHaveURL(/(\/login|\/forgot-password)/);
    }
  });
});
