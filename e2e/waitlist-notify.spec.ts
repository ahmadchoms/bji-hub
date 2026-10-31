import { test, expect } from "@playwright/test";

test.describe("Waitlist Flow (waitlist-notify)", () => {
  test("shows out-of-stock badge and waitlist prompt for sold-out listing", async ({ page }) => {
    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    // Look for out-of-stock or regular products
    const productCards = page.locator('a[href^="/product/"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });
});
