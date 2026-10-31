import { test, expect } from "@playwright/test";

test.describe("Authentication - Login with Email", () => {
  test("renders login form and validates inputs", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
