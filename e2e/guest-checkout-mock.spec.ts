import { test, expect } from "@playwright/test";

test.describe("Guest Checkout Flow (guest-checkout-mock)", () => {
  test("allows browsing catalog and viewing product details", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Wait for product cards to stream in and become visible
    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });

    // Click the product title or link and verify product page URL
    await Promise.all([
      page.waitForURL(/\/product\//, { timeout: 15000 }),
      firstProduct.locator("h2").click(),
    ]);
    await expect(page).toHaveURL(/\/product\//);
  });
});
