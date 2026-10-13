import { describe, it, expect } from "vitest";
import { computeReviewStats } from "@/lib/data/reviews";
import type { Review } from "@/types";

describe("reviews data and stats", () => {
  it("calculates correct average and count for empty reviews", () => {
    const stats = computeReviewStats([]);
    expect(stats.average).toBe(0);
    expect(stats.count).toBe(0);
  });

  it("calculates accurate average rounded to 1 decimal place", () => {
    const reviews: Review[] = [
      {
        id: "r1",
        listingId: "list-1",
        buyerName: "Budi",
        rating: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: "r2",
        listingId: "list-1",
        buyerName: "Siti",
        rating: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: "r3",
        listingId: "list-1",
        buyerName: "Ahmad",
        rating: 4,
        createdAt: new Date().toISOString(),
      },
    ];

    const stats = computeReviewStats(reviews);
    // (5 + 4 + 4) / 3 = 4.3333... -> 4.3
    expect(stats.average).toBe(4.3);
    expect(stats.count).toBe(3);
  });
});
