import { test, expect } from "@playwright/test";

test.describe("Admin Dispute & Refund (admin-dispute-refund)", () => {
  test("unauthenticated access to admin refunds is blocked and redirected to login", async ({ page }) => {
    await page.goto("/admin/refunds");
    await expect(page).toHaveURL(/\/login/);
  });
});
