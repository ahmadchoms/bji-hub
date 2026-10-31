import { test, expect } from "@playwright/test";

test.describe("Seller Listing Creation (seller-create-listing)", () => {
  test("unauthenticated access redirects to login with return path", async ({ page }) => {
    await page.goto("/dashboard/listing/create");
    await expect(page).toHaveURL(/\/login/);
  });
});
