import { describe, it, expect, vi, beforeEach } from "vitest";
import { replyToReviewAction, reportReviewAction } from "./review.actions";
import { asSellerProfileId, asUserId } from "@/types/ids";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  requireSeller: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/data/reviews", () => ({
  replyToReview: vi.fn(),
  reportReview: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

import { getSession, requireSeller } from "@/lib/auth/session";
import { replyToReview, reportReview } from "@/lib/data/reviews";

describe("Review Actions AuthZ Matrix (B2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("replyToReviewAction", () => {
    it("rejects non-owner seller when replyToReview returns false", async () => {
      vi.mocked(requireSeller).mockResolvedValue({
        session: {
          role: "seller",
          sellerId: asSellerProfileId("seller-other"),
          userId: asUserId("user-other"),
        },
        sellerId: "seller-other",
      });
      vi.mocked(replyToReview).mockResolvedValue(false);

      const res = await replyToReviewAction({
        reviewId: "rev-1",
        reply: "Terima kasih atas ulasannya!",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("tidak memiliki akses");
      }
    });

    it("allows owning seller to reply successfully", async () => {
      vi.mocked(requireSeller).mockResolvedValue({
        session: {
          role: "seller",
          sellerId: asSellerProfileId("seller-owner"),
          userId: asUserId("user-owner"),
        },
        sellerId: "seller-owner",
      });
      vi.mocked(replyToReview).mockResolvedValue(true);

      const res = await replyToReviewAction({
        reviewId: "rev-1",
        reply: "Terima kasih banyak sudah berbelanja di toko kami!",
      });

      expect(res.success).toBe(true);
      expect(replyToReview).toHaveBeenCalledWith(
        "rev-1",
        "seller-owner",
        "Terima kasih banyak sudah berbelanja di toko kami!"
      );
    });
  });

  describe("reportReviewAction", () => {
    it("rejects guest users", async () => {
      vi.mocked(getSession).mockResolvedValue({
        role: "guest",
        sellerId: null,
        userId: null,
      });

      const res = await reportReviewAction({
        reviewId: "rev-1",
        reason: "Ulasan mengandung spam dan tautan judi",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("masuk terlebih dahulu");
      }
    });

    it("maps fail-closed error to user friendly message when reporter is ineligible (A4)", async () => {
      vi.mocked(getSession).mockResolvedValue({
        role: "buyer",
        sellerId: null,
        userId: asUserId("buyer-newbie"),
      });
      vi.mocked(reportReview).mockRejectedValue(
        new Error("Akun Anda belum memenuhi syarat melaporkan ulasan")
      );

      const res = await reportReviewAction({
        reviewId: "rev-1",
        reason: "Ulasan mencurigakan dan kasar",
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("belum memenuhi syarat");
      }
    });

    it("allows eligible user to report review successfully", async () => {
      vi.mocked(getSession).mockResolvedValue({
        role: "buyer",
        sellerId: null,
        userId: asUserId("buyer-veteran"),
      });
      vi.mocked(reportReview).mockResolvedValue(true);

      const res = await reportReviewAction({
        reviewId: "rev-1",
        reason: "Ulasan tidak relevan dengan produk biji kopi",
      });

      expect(res.success).toBe(true);
      expect(reportReview).toHaveBeenCalledWith(
        "rev-1",
        "buyer-veteran",
        "Ulasan tidak relevan dengan produk biji kopi"
      );
    });
  });
});
