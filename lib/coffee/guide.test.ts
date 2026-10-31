import { describe, it, expect } from "vitest";
import {
  scoreListingForGuide,
  recommendCoffeeForGuide,
  getBrewMethodRoastMatch,
  getBudgetMatch,
  getFreshnessScore,
  type CoffeeGuideCriteria,
} from "./guide";
import type { ListingWithRelations } from "@/types";
import { asSellerProfileId } from "@/types/ids";

describe("lib/coffee/guide", () => {
  const baseListing: ListingWithRelations = {
    id: "lst-1" as any,
    sellerId: asSellerProfileId("seller-1"),
    title: "Gayo Bourbon Natural",
    slug: "gayo-bourbon-natural",
    description: "Kopi aromatik dengan keasaman segar",
    price: 120000,
    unit: "200g",
    stock: 15,
    status: "active",
    minOrderQty: 1,
    categoryId: "cat-arabica",
    category: {
      id: "cat-arabica",
      name: "Arabica",
      slug: "arabica",
    },
    images: [],
    isBoosted: false,
    createdAt: new Date().toISOString(),
    seller: {
      id: "seller-1",
      userId: "user-1",
      businessName: "Kopi Aceh",
      slug: "kopi-aceh",
      city: "Takengon",
      province: "Aceh",
      address: "Jl. Takengon",
      whatsappNumber: "081234567890",
      tier: "free",
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
    tasteProfile: {
      id: "tp-1",
      listingId: "lst-1",
      originRegion: "Gayo",
      roastLevel: "Light",
      processMethod: "Natural",
      acidityScore: 4,
      sweetnessScore: 4,
      bodyScore: 3,
      flavorNotes: "Blackberry, Jasmine",
      roastDate: "2026-10-25T00:00:00+07:00",
    },
  };

  it("calculates roast level match correctly for different brew methods", () => {
    expect(getBrewMethodRoastMatch("Light", "v60")).toBe(1.0);
    expect(getBrewMethodRoastMatch("Dark", "v60")).toBe(0.3);
    expect(getBrewMethodRoastMatch("Medium-Dark", "espresso")).toBe(1.0);
    expect(getBrewMethodRoastMatch("Light", "espresso")).toBe(0.2);
  });

  it("calculates budget suitability match correctly", () => {
    expect(getBudgetMatch(100000, 150000)).toBe(1.0);
    expect(getBudgetMatch(160000, 150000)).toBe(0.5); // <= 1.25x
    expect(getBudgetMatch(250000, 150000)).toBe(0.1); // > 1.25x
    expect(getBudgetMatch(100000, undefined)).toBe(1.0); // no limit
  });

  it("calculates freshness score based on preference", () => {
    const fixedNow = new Date("2026-10-31T00:00:00+07:00");
    const roast6DaysAgo = new Date("2026-10-25T00:00:00+07:00");
    const score = getFreshnessScore(roast6DaysAgo, "Light", "ultra_fresh", fixedNow);
    expect(score).toBe(1.0);
  });

  it("scores single listing following the specified weights (0.5 taste, 0.2 brew, 0.2 budget, 0.1 freshness)", () => {
    const criteria: CoffeeGuideCriteria = {
      brewMethod: "v60",
      acidity: 4,
      sweetness: 4,
      body: 3,
      maxPrice: 150000,
      freshnessPreference: "optimal",
    };

    const fixedNow = new Date("2026-10-31T00:00:00+07:00");
    const result = scoreListingForGuide(baseListing, criteria, fixedNow);

    expect(result.tasteScore).toBeGreaterThanOrEqual(0.95);
    expect(result.brewMatch).toBe(1.0);
    expect(result.budgetMatch).toBe(1.0);
    expect(result.totalScore).toBeGreaterThan(0.8);
    expect(result.reason).toContain("Cocok untuk V60");
    expect(result.reason).toContain("Notes: Blackberry, Jasmine");
  });

  it("never recommends inactive or out-of-stock listings (D1 Acceptance)", () => {
    const activeInStock: ListingWithRelations = { ...baseListing, id: "active-1" as any, stock: 10, status: "active" };
    const outOfStock: ListingWithRelations = { ...baseListing, id: "oos-1" as any, stock: 0, status: "active" };
    const inactive: ListingWithRelations = { ...baseListing, id: "inact-1" as any, stock: 5, status: "archived" };

    const criteria: CoffeeGuideCriteria = {
      brewMethod: "v60",
      acidity: 4,
      sweetness: 4,
      body: 3,
    };

    const recs = recommendCoffeeForGuide([activeInStock, outOfStock, inactive], criteria, 3);
    expect(recs).toHaveLength(1);
    expect(recs[0].listing.id).toBe("active-1");
  });

  it("limits recommendations to requested limit", () => {
    const list = [1, 2, 3, 4, 5].map((i) => ({
      ...baseListing,
      id: `item-${i}` as any,
      stock: 5,
      status: "active" as const,
      price: 100000 + i * 10000,
    }));

    const criteria: CoffeeGuideCriteria = {
      brewMethod: "v60",
      acidity: 3,
      sweetness: 3,
      body: 3,
    };

    const recs = recommendCoffeeForGuide(list, criteria, 3);
    expect(recs).toHaveLength(3);
  });
});
