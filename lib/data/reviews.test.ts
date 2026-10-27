import { describe, it, expect } from "vitest";
import { computeReviewStats } from "@/lib/data/reviews";
import type { Review } from "@/types";

process.env.DATA_SOURCE = "mock";

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

  it("handles getReviewsByListingIds with empty list", async () => {
    const { getReviewsByListingIds } = await import("@/lib/data/reviews");
    const res = await getReviewsByListingIds([]);
    expect(res).toEqual([]);
  });

  it("stores and retrieves review by orderId and listingId", async () => {
    const { createReview, getReviewByOrderAndListing, _resetMockReviewsForTest } =
      await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    const created = await createReview({
      orderId: "ord-test-unique-1",
      listingId: "list-1",
      buyerId: "user-1",
      buyerName: "Test User",
      rating: 5,
      comment: "Luar biasa",
    });

    const found = await getReviewByOrderAndListing("ord-test-unique-1", "list-1");
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.rating).toBe(5);

    const notFound = await getReviewByOrderAndListing("ord-test-unique-1", "list-other");
    expect(notFound).toBeNull();
  });

  it("handles seller reply and review reporting (F9)", async () => {
    const { createReview, replyToReview, reportReview, getReviewsByListing, _resetMockReviewsForTest } =
      await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    const rev = await createReview({
      listingId: "list-f9",
      buyerName: "Buyer 1",
      rating: 4,
      comment: "Rasa enak tapi packaging agak penyok",
    });

    const replySuccess = await replyToReview(rev.id, "Terima kasih atas masukannya, kami perbaiki kemasan.");
    expect(replySuccess).toBe(true);

    const reportSuccess = await reportReview(rev.id, "Spam ulasan palsu");
    expect(reportSuccess).toBe(true);

    const list = await getReviewsByListing("list-f9");
    expect(list.length).toBe(1);
    expect(list[0].sellerReply).toBe("Terima kasih atas masukannya, kami perbaiki kemasan.");
    expect(list[0].isReported).toBe(true);
    expect(list[0].reportReason).toBe("Spam ulasan palsu");
  });
});
