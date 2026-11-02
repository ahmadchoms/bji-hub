import { describe, it, expect, beforeEach, vi } from "vitest";
import { getBundleEffectiveStock, mockBundleItems, saveBundleItems } from "./bundles";
import { savePriceTiers, mockPriceTiers } from "./b2b";

describe("Tasting Bundles & B2B Tiers (Task J3)", () => {
  beforeEach(() => {
    vi.stubEnv("DATA_SOURCE", "mock");
    mockBundleItems.length = 0;
    mockPriceTiers.length = 0;
  });

  describe("getBundleEffectiveStock", () => {
    it("returns null if listing is not a bundle", async () => {
      const stock = await getBundleEffectiveStock("non-bundle");
      expect(stock).toBeNull();
    });

    it("calculates minimum effective stock correctly across components", async () => {
      mockBundleItems.push(
        { id: "b1", bundleListingId: "bundle-1", childListingId: "c1", quantity: 1, childStock: 10 },
        { id: "b2", bundleListingId: "bundle-1", childListingId: "c2", quantity: 2, childStock: 5 },
      );

      const stock = await getBundleEffectiveStock("bundle-1");
      expect(stock).toBe(2);
    });

    it("returns 0 if any required component is out of stock", async () => {
      mockBundleItems.push(
        { id: "b1", bundleListingId: "bundle-1", childListingId: "c1", quantity: 1, childStock: 10 },
        { id: "b2", bundleListingId: "bundle-1", childListingId: "c2", quantity: 2, childStock: 1 },
      );

      const stock = await getBundleEffectiveStock("bundle-1");
      expect(stock).toBe(0);
    });
  });

  describe("saveBundleItems validation", () => {
    it("rejects bundles with fewer than 2 items", async () => {
      await expect(
        saveBundleItems("bundle-1", "seller-1", [
          { childListingId: "c1", quantity: 1 },
        ])
      ).rejects.toThrow(/2 hingga 5/);
    });

    it("rejects bundles with more than 5 items", async () => {
      await expect(
        saveBundleItems("bundle-1", "seller-1", [
          { childListingId: "c1", quantity: 1 },
          { childListingId: "c2", quantity: 1 },
          { childListingId: "c3", quantity: 1 },
          { childListingId: "c4", quantity: 1 },
          { childListingId: "c5", quantity: 1 },
          { childListingId: "c6", quantity: 1 },
        ])
      ).rejects.toThrow(/2 hingga 5/);
    });
  });

  describe("savePriceTiers monotonic validation", () => {
    it("saves valid monotonic tiers", async () => {
      const res = await savePriceTiers("listing-1", "seller-1", [
        { minQty: 5, unitPrice: 90000 },
        { minQty: 10, unitPrice: 80000 },
      ]);
      expect(res).toBe(true);
    });

    it("rejects non-monotonic minQty", async () => {
      await expect(
        savePriceTiers("listing-1", "seller-1", [
          { minQty: 10, unitPrice: 90000 },
          { minQty: 5, unitPrice: 80000 },
        ])
      ).rejects.toThrow(/bertambah naik/);
    });

    it("rejects non-decreasing unitPrice", async () => {
      await expect(
        savePriceTiers("listing-1", "seller-1", [
          { minQty: 5, unitPrice: 80000 },
          { minQty: 10, unitPrice: 85000 },
        ])
      ).rejects.toThrow(/semakin murah/);
    });
  });
});
