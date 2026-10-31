import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { width: 360, height: 640, name: "Mobile Small (360x640)" },
  { width: 390, height: 844, name: "iPhone 12/13/14 (390x844)" },
  { width: 768, height: 1024, name: "Tablet Portrait (768x1024)" },
  { width: 1024, height: 768, name: "Tablet Landscape (1024x768)" },
  { width: 1440, height: 900, name: "Desktop (1440x900)" },
];

test.describe("Responsive Viewport Matrix (viewport-matrix)", () => {
  for (const vp of VIEWPORTS) {
    test(`renders homepage cleanly at ${vp.name} without horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");

      // Verify no horizontal overflow/scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for subpixel rendering
    });
  }
});
