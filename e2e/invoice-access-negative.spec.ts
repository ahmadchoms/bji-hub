import { test, expect } from "@playwright/test";

test.describe("Invoice Security & Access Control (invoice-access-negative)", () => {
  test("rejects access to invoice without valid secret token", async ({ page }) => {
    // Navigating without token parameter
    await page.goto("/order/invoice?orderId=fake-order-id");
    await page.waitForLoadState("domcontentloaded");

    // Must not show invoice or should redirect to login/error
    const currentUrl = page.url();
    const bodyText = await page.textContent("body");

    const accessBlocked =
      currentUrl.includes("/login") ||
      currentUrl.includes("/order/pending") ||
      bodyText?.includes("tidak ditemukan") ||
      bodyText?.includes("Akses ditolak") ||
      bodyText?.includes("Token tidak valid");

    expect(accessBlocked).toBe(true);
  });
});
