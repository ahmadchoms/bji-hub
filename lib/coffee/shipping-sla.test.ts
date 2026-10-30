import { describe, it, expect } from "vitest";
import { computeMedian, calculateRoastToShipSla } from "./shipping-sla";

describe("Shipping SLA Engine (COF-13)", () => {
  it("calculates median correctly for odd and even arrays", () => {
    expect(computeMedian([])).toBeNull();
    expect(computeMedian([2])).toBe(2);
    expect(computeMedian([1, 2, 3])).toBe(2);
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5);
    expect(computeMedian([5, 1, 3])).toBe(3);
  });

  it("evaluates seller qualification for fresh roast shipping badge", async () => {
    const fastRoaster = await calculateRoastToShipSla("seller-1");
    expect(fastRoaster.qualifiesForSlaBadge).toBe(true);
    expect(fastRoaster.medianDays).toBeLessThanOrEqual(3);

    const regularSeller = await calculateRoastToShipSla("seller-unknown");
    expect(regularSeller.qualifiesForSlaBadge).toBe(false);
  });
});
