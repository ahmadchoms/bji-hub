import { test, expect } from "@playwright/test";

test.describe("Content Security Policy (csp-no-violations)", () => {
  test("ensures zero CSP violations across key public pages", async ({ page }) => {
    const violations: unknown[] = [];

    await page.exposeFunction("onCspViolation", (detail: unknown) => {
      violations.push(detail);
    });

    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { onCspViolation: (d: unknown) => void }).onCspViolation({
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          documentURI: e.documentURI,
        });
      });
    });

    // Test home, catalog, and login
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/catalog");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // In local development, Next.js dev server uses eval for source-maps/HMR.
    // In CI production build (npm run start), eval is completely forbidden and zero violations must exist.
    const isDev = !process.env.CI;
    const unexpectedViolations = isDev
      ? violations.filter((v) => (v as { blockedURI?: string })?.blockedURI !== "eval")
      : violations;

    expect(unexpectedViolations).toEqual([]);
  });
});
