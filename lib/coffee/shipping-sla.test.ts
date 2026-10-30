import { describe, it, expect, vi } from "vitest";
import { computeMedian, calculateRoastToShipSla } from "./shipping-sla";

describe("Shipping SLA Engine (COF-13 / F4)", () => {
  it("calculates median correctly for empty, single, odd and even arrays", () => {
    expect(computeMedian([])).toBeNull();
    expect(computeMedian([2])).toBe(2);
    expect(computeMedian([1, 2, 3])).toBe(2);
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
    expect(computeMedian([5, 1, 3])).toBe(3);
  });

  it("evaluates seller qualification for fresh roast shipping badge (>= 5 samples and median <= 3)", async () => {
    const fastRoaster = await calculateRoastToShipSla("seller-1");
    expect(fastRoaster.qualifiesForSlaBadge).toBe(true);
    expect(fastRoaster.medianDays).toBeLessThanOrEqual(3);
    expect(fastRoaster.samplesCount).toBeGreaterThanOrEqual(5);

    const regularSeller = await calculateRoastToShipSla("seller-unknown");
    expect(regularSeller.qualifiesForSlaBadge).toBe(false);
  });

  it("does not render mock data in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = await calculateRoastToShipSla("seller-1");
      expect(res.qualifiesForSlaBadge).toBe(false);
      expect(res.medianDays).toBeNull();
      expect(res.samplesCount).toBe(0);
      expect(res.isMockData).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
