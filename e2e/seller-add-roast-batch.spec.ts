import { test, expect } from "@playwright/test";

test.describe("Seller Roast Batch (seller-add-roast-batch)", () => {
  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/dashboard/listing");
    await expect(page).toHaveURL(/\/login/);
  });
});
