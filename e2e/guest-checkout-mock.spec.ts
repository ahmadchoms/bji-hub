import { test, expect } from "@playwright/test";

test.describe("Guest Checkout Flow (guest-checkout-mock)", () => {
  test("allows browsing catalog and viewing product details", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Product cards should be visible
    const productLinks = page.locator('a[href^="/product/"]');
    const count = await productLinks.count();
    expect(count).toBeGreaterThan(0);

    // Click the first product
    await productLinks.first().click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/product\//);
  });
});
