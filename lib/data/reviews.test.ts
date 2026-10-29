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

  it("handles seller reply with IDOR ownership check and review reporting (F9 / M4)", async () => {
    const { createReview, replyToReview, reportReview, getReviewsByListing, _resetMockReviewsForTest } =
      await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    const rev = await createReview({
      listingId: "list-1", // list-1 belongs to seller-1
      buyerName: "Buyer 1",
      rating: 4,
      comment: "Rasa enak tapi packaging agak penyok",
    });

    // 1. Non-owner seller (seller-2) attempts to reply -> rejected (M4 IDOR protection)
    const unauthorizedReply = await replyToReview(
      rev.id,
      "seller-2",
      "Saya bukan pemilik tapi mau balas",
    );
    expect(unauthorizedReply).toBe(false);

    // 2. Owner seller (seller-1) replies -> succeeded
    const replySuccess = await replyToReview(
      rev.id,
      "seller-1",
      "Terima kasih atas masukannya, kami perbaiki kemasan.",
    );
    expect(replySuccess).toBe(true);

    // 3. Second reply attempt -> rejected (single reply limit)
    const duplicateReply = await replyToReview(
      rev.id,
      "seller-1",
      "Balasan kedua tidak boleh",
    );
    expect(duplicateReply).toBe(false);

    // 4. Reporting review (SEC-2)
    const reportSuccess = await reportReview(rev.id, "reporter-1", "Spam ulasan palsu");
    expect(reportSuccess).toBe(true);

    const list = await getReviewsByListing("list-1");
    expect(list.length).toBe(1);
    expect(list[0].sellerReply).toBe("Terima kasih atas masukannya, kami perbaiki kemasan.");
    expect(list[0].isReported).toBe(true);
    expect(list[0].reportReason).toBe("Spam ulasan palsu");
  });

  it("prevents reviewer from reporting their own review (SEC-2)", async () => {
    const { createReview, reportReview, _resetMockReviewsForTest } =
      await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    const rev = await createReview({
      listingId: "list-1",
      buyerId: "buyer-author-123",
      buyerName: "Author",
      rating: 5,
      comment: "Kopi terbaik!",
    });

    await expect(
      reportReview(rev.id, "buyer-author-123", "Alasan palsu pelaporan")
    ).rejects.toThrow("Pelapor tidak boleh melaporkan ulasannya sendiri.");
  });

  it("hides review when 3 or more distinct reporters flag it (SEC-2)", async () => {
    const { createReview, reportReview, getReviewsByListing, _resetMockReviewsForTest } =
      await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    const rev = await createReview({
      listingId: "list-1",
      buyerId: "buyer-1",
      buyerName: "Buyer",
      rating: 1,
      comment: "Ulasan negatif mencurigakan",
    });

    // 1st reporter
    await reportReview(rev.id, "reporter-1", "Indikasi bot / spam");
    let visible = await getReviewsByListing("list-1");
    expect(visible.length).toBe(1);

    // 2nd reporter
    await reportReview(rev.id, "reporter-2", "Ulasan melanggar aturan");
    visible = await getReviewsByListing("list-1");
    expect(visible.length).toBe(1);

    // 3rd distinct reporter -> hits threshold >= 3 -> hidden_pending_review
    await reportReview(rev.id, "reporter-3", "Konten promosi produk lain");
    visible = await getReviewsByListing("list-1");
    expect(visible.length).toBe(0);
  });

  it("enforces reporter eligibility: blocks store owner, new accounts, and dismissed re-reports (N7)", async () => {
    const {
      createReview,
      reportReview,
      adminApproveReview,
      getReviewsByListing,
      _configureMockReporter,
      _resetMockReviewsForTest,
    } = await import("@/lib/data/reviews");
    _resetMockReviewsForTest();

    // list-1 belongs to seller-1 (userId: "user-1" / "seller-1")
    const rev = await createReview({
      listingId: "list-1",
      buyerId: "buyer-author",
      buyerName: "Buyer Author",
      rating: 2,
      comment: "Rasa kurang pas",
    });

    // 1. Listing owner cannot report reviews on their own listing
    await expect(
      reportReview(rev.id, "seller-1", "Saya pemilik toko ingin hapus ini")
    ).rejects.toThrow("Pemilik toko tidak dapat melaporkan ulasan pada produk sendiri.");

    // 2. New account (< 7 days old) cannot report
    _configureMockReporter("newbie-user", {
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days old
      completedOrdersCount: 5,
    });
    await expect(
      reportReview(rev.id, "newbie-user", "Akun baru coba melapor")
    ).rejects.toThrow("Akun Anda harus berumur minimal 7 hari untuk dapat melaporkan ulasan.");

    // 3. Account with 0 completed orders cannot report
    _configureMockReporter("zero-order-user", {
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      completedOrdersCount: 0,
    });
    await expect(
      reportReview(rev.id, "zero-order-user", "Akun lama tanpa belanja")
    ).rejects.toThrow("Anda harus memiliki minimal 1 pesanan selesai untuk dapat melaporkan ulasan.");

    // 4. Three eligible reporters hide the review
    await reportReview(rev.id, "rep-a", "Alasan valid spam 1");
    await reportReview(rev.id, "rep-b", "Alasan valid spam 2");
    await reportReview(rev.id, "rep-c", "Alasan valid spam 3");

    let reviews = await getReviewsByListing("list-1");
    expect(reviews.length).toBe(0); // hidden_pending_review

    // 5. Admin approves review and dismisses previous reports
    const approved = await adminApproveReview(rev.id);
    expect(approved).toBe(true);

    reviews = await getReviewsByListing("list-1");
    expect(reviews.length).toBe(1); // restored to approved

    // 6. Dismissed report cannot be reopened by the same reporter
    await expect(
      reportReview(rev.id, "rep-a", "Coba spam laporan lagi setelah ditolak")
    ).rejects.toThrow("Laporan Anda sudah ditinjau.");
  });
});
