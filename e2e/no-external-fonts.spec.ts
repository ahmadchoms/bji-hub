import { test, expect } from "@playwright/test";

test.describe("Font Self-Hosting & Privacy (no-external-fonts)", () => {
  test("ensures zero external requests to Google Fonts or third-party font CDNs", async ({ page }) => {
    const externalFontRequests: string[] = [];

    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("fonts.googleapis.com") ||
        url.includes("fonts.gstatic.com") ||
        url.includes("use.typekit.net")
      ) {
        externalFontRequests.push(url);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    expect(externalFontRequests).toEqual([]);
  });
});
