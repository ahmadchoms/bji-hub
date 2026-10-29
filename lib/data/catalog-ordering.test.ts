import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import { getListings } from "@/lib/mock/repository";
import { createReview } from "@/lib/data/reviews";
import { mockListings } from "@/lib/mock/data";

describe("Catalog Ordering & Rating Denormalization (N4)", () => {
  it("sorts by cupping_desc with NULLs last", async () => {
    const { items: listings } = await getListings({ sort: "cupping_desc" });
    expect(listings.length).toBeGreaterThan(0);

    // First listing must have a valid cupping score
    expect(listings[0].tasteProfile?.cuppingScore).toBeDefined();

    // Verify descending order for those with scores
    for (let i = 0; i < listings.length - 1; i++) {
      const aScore = listings[i].tasteProfile?.cuppingScore ?? -1;
      const bScore = listings[i + 1].tasteProfile?.cuppingScore ?? -1;
      expect(aScore).toBeGreaterThanOrEqual(bScore);
    }

    // Last items should be ones with no tasteProfile or no cuppingScore
    const lastItem = listings[listings.length - 1];
    expect(lastItem.tasteProfile?.cuppingScore ?? null).toBeNull();
  });

  it("sorts by freshest excluding green beans and placing NULLs last", async () => {
    const { items: listings } = await getListings({ sort: "freshest" });
    expect(listings.length).toBeGreaterThan(0);

    // No green bean items in freshest sort
    const hasGreenBean = listings.some(
      (l) => l.category?.slug === "green-beans" || l.categoryId === "cat-1"
    );
    expect(hasGreenBean).toBe(false);

    // Every item returned must have a valid roastDate in the past
    const now = Date.now();
    for (const item of listings) {
      expect(item.tasteProfile?.roastDate).toBeDefined();
      const roastTime = new Date(item.tasteProfile!.roastDate!).getTime();
      expect(roastTime).toBeLessThanOrEqual(now);
    }
  });

  it("sorts by rating_desc based on real ratingAvg with NULLs last", async () => {
    const { items: listings } = await getListings({ sort: "rating_desc" });
    expect(listings.length).toBeGreaterThan(0);

    // First items must have ratings
    expect(listings[0].ratingAvg).toBeDefined();

    // Verify descending order
    for (let i = 0; i < listings.length - 1; i++) {
      const aRate = listings[i].ratingAvg ?? -1;
      const bRate = listings[i + 1].ratingAvg ?? -1;
      expect(aRate).toBeGreaterThanOrEqual(bRate);
    }

    // Item without rating (list-13) must be at the end
    const lastItem = listings[listings.length - 1];
    expect(lastItem.ratingAvg ?? null).toBeNull();
  });

  it("updates listing ratingAvg and ratingCount when new review is created", async () => {
    const testListingId = "list-test-rating";
    mockListings.push({
      id: testListingId,
      slug: "test-rating-coffee",
      sellerId: "seller-1",
      categoryId: "cat-2",
      title: "Test Rating Coffee 200g",
      price: 100000,
      unit: "200g",
      minOrderQty: 1,
      status: "active",
      isBoosted: false,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      seller: mockListings[0].seller,
      category: mockListings[0].category,
      images: [],
    });

    await createReview({
      listingId: testListingId,
      buyerName: "Penilai Kopi",
      rating: 5,
      comment: "Luar biasa harum!",
    });

    const target = mockListings.find((l) => l.id === testListingId);
    expect(target?.ratingCount).toBe(1);
    expect(target?.ratingAvg).toBe(5);

    await createReview({
      listingId: testListingId,
      buyerName: "Penilai Kedua",
      rating: 4,
      comment: "Cukup enak",
    });

    expect(target?.ratingCount).toBe(2);
    expect(target?.ratingAvg).toBe(4.5);
  });
});
