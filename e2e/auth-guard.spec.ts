import { test, expect } from "@playwright/test";

test.describe("Authentication Guards", () => {
  test("unauthenticated access to /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
