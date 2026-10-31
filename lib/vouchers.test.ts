import { describe, it, expect } from "vitest";
import { calculateVoucherDiscount, type VoucherRule } from "./vouchers";

describe("calculateVoucherDiscount (C1)", () => {
  it("returns 0 if subtotal is below minimum subtotal", () => {
    const rule: VoucherRule = {
      type: "fixed",
      value: 20000,
      minSubtotal: 100000,
      maxDiscount: null,
    };
    expect(calculateVoucherDiscount(rule, 99999, 15000)).toBe(0);
  });

  it("calculates percentage discount accurately and respects maxDiscount cap", () => {
    const rule: VoucherRule = {
      type: "percent",
      value: 20, // 20%
      minSubtotal: 50000,
      maxDiscount: 25000,
    };

    // 20% of 100,000 = 20,000 (under 25k cap)
    expect(calculateVoucherDiscount(rule, 100000, 15000)).toBe(20000);

    // 20% of 200,000 = 40,000 (capped at 25k)
    expect(calculateVoucherDiscount(rule, 200000, 15000)).toBe(25000);
  });

  it("calculates fixed discount and never exceeds subtotal", () => {
    const rule: VoucherRule = {
      type: "fixed",
      value: 50000,
      minSubtotal: 30000,
      maxDiscount: null,
    };

    // Subtotal 40,000 with discount 50,000 should be capped at 40,000 (discount cannot exceed subtotal)
    expect(calculateVoucherDiscount(rule, 40000, 15000)).toBe(40000);
    expect(calculateVoucherDiscount(rule, 80000, 15000)).toBe(50000);
  });

  it("calculates free shipping discount capped at shipping cost", () => {
    const rule: VoucherRule = {
      type: "free_shipping",
      value: 0,
      minSubtotal: 50000,
      maxDiscount: 20000,
    };

    // Shipping cost 15,000 -> full 15,000
    expect(calculateVoucherDiscount(rule, 60000, 15000)).toBe(15000);

    // Shipping cost 30,000 -> capped at 20,000 maxDiscount
    expect(calculateVoucherDiscount(rule, 60000, 30000)).toBe(20000);
  });
});
