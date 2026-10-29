import { Pool } from "pg";
import { logger } from "@/lib/logger";
import type { Review } from "@/types";

let poolInstance: Pool | null = null;
function getPool(): Pool | null {
  if (process.env.DATA_SOURCE === "mock") return null;
  const conn = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!conn) return null;
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: conn });
  }
  return poolInstance;
}

const mockReviews: Review[] = [];

interface MockReviewReport {
  reviewId: string;
  reporterId: string;
  reason: string;
  status: "open" | "dismissed" | "actioned";
  createdAt: string;
}

const mockReviewReports: MockReviewReport[] = [];

export async function createReview(data: {
  orderId?: string | null;
  listingId: string;
  buyerId?: string | null;
  buyerName: string;
  rating: number;
  comment?: string | null;
  imageUrl?: string | null;
}): Promise<Review> {
  const pool = getPool();
  const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newReview: Review = {
    id,
    orderId: data.orderId ?? null,
    listingId: data.listingId,
    buyerId: data.buyerId ?? null,
    buyerName: data.buyerName,
    rating: Math.max(1, Math.min(5, data.rating)),
    comment: data.comment ?? null,
    imageUrl: data.imageUrl ?? null,
    createdAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.reviews (
          id, order_id, listing_id, buyer_id, buyer_name, rating, comment, image_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          data.orderId ?? null,
          data.listingId,
          data.buyerId ?? null,
          data.buyerName,
          newReview.rating,
          newReview.comment,
          newReview.imageUrl,
          now,
        ],
      );
    } catch (e) {
      logger.error("reviews.insert_failed", e, { orderId: data.orderId, listingId: data.listingId });
    }
  }

  mockReviews.unshift(newReview);
  return newReview;
}

export async function getReviewByOrderAndListing(
  orderId: string,
  listingId: string,
): Promise<Review | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM public.reviews
         WHERE order_id = $1 AND listing_id = $2
         LIMIT 1`,
        [orderId, listingId],
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          orderId: row.order_id,
          listingId: row.listing_id,
          buyerId: row.buyer_id,
          buyerName: row.buyer_name,
          rating: Number(row.rating),
          comment: row.comment,
          imageUrl: row.image_url ?? null,
          createdAt: row.created_at,
        };
      }
      return null;
    } catch {
      // ignore: fallback to mock store in dev/test
    }
  }

  return (
    mockReviews.find((r) => r.orderId === orderId && r.listingId === listingId) ??
    null
  );
}

export function _resetMockReviewsForTest(): void {
  mockReviews.length = 0;
  mockReviewReports.length = 0;
}

function mapReviewRow(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    orderId: (row.order_id || row.orderId || null) as string | null,
    listingId: String(row.listing_id || row.listingId),
    buyerId: (row.buyer_id || row.buyerId || null) as string | null,
    buyerName: String(row.buyer_name || row.buyerName),
    rating: Number(row.rating),
    comment: (row.comment || null) as string | null,
    imageUrl: (row.image_url || row.imageUrl || null) as string | null,
    sellerReply: (row.seller_reply || row.sellerReply || null) as string | null,
    sellerRepliedAt: row.seller_replied_at
      ? new Date(row.seller_replied_at as string).toISOString()
      : (row.sellerRepliedAt as string | null) ?? null,
    isReported: Boolean(row.is_reported || row.isReported),
    reportReason: (row.report_reason || row.reportReason || null) as string | null,
    moderationStatus: (row.moderation_status || row.moderationStatus || "approved") as Review["moderationStatus"],
    createdAt: new Date((row.created_at || row.createdAt) as string).toISOString(),
  };
}

export async function getReviewsByListing(listingId: string): Promise<Review[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM public.reviews
         WHERE listing_id = $1
           AND (moderation_status IS NULL OR moderation_status != 'hidden_pending_review')
         ORDER BY created_at DESC`,
        [listingId],
      );
      return res.rows.map(mapReviewRow);
    } catch {
      // ignore: reviews db query fallback to mock store in dev
      // Fall through
    }
  }

  return mockReviews.filter(
    (r) => r.listingId === listingId && r.moderationStatus !== "hidden_pending_review"
  );
}

export async function getReviewsByListingIds(listingIds: string[]): Promise<Review[]> {
  if (listingIds.length === 0) return [];
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM public.reviews
         WHERE listing_id = ANY($1)
         ORDER BY created_at DESC`,
        [listingIds],
      );
      return res.rows.map(mapReviewRow);
    } catch {
      // ignore: reviews db query fallback to mock store in dev
      // Fall through
    }
  }

  const idSet = new Set(listingIds);
  return mockReviews.filter((r) => idSet.has(r.listingId));
}

export function computeReviewStats(reviews: Review[]): {
  average: number;
  count: number;
} {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function getReviewsByBuyer(buyerId: string): Promise<Review[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, order_id as "orderId", listing_id as "listingId",
                buyer_id as "buyerId", buyer_name as "buyerName",
                rating, comment, image_url as "imageUrl", created_at as "createdAt"
         FROM public.reviews
         WHERE buyer_id = $1
         ORDER BY created_at DESC`,
        [buyerId],
      );
      return res.rows.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        listingId: row.listingId,
        buyerId: row.buyerId,
        buyerName: row.buyerName,
        rating: Number(row.rating),
        comment: row.comment,
        imageUrl: row.imageUrl ?? null,
        createdAt: new Date(row.createdAt).toISOString(),
      }));
    } catch {
      return [];
    }
  }
  return mockReviews.filter((r) => r.buyerId === buyerId);
}

export async function replyToReview(
  reviewId: string,
  sellerId: string,
  replyText: string,
): Promise<boolean> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.reviews r
         SET seller_reply = $1, seller_replied_at = $2
         FROM public.listings l
         WHERE r.id = $3
           AND r.listing_id = l.id
           AND l.seller_id = $4
           AND r.seller_reply IS NULL`,
        [replyText.trim(), now, reviewId, sellerId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("reviews.reply_failed", err, { reviewId, sellerId });
      return false;
    }
  }

  const { mockListings } = await import("@/lib/mock/data");
  const r = mockReviews.find((rev) => rev.id === reviewId);
  if (r && !r.sellerReply) {
    const listing = mockListings.find((l) => l.id === r.listingId);
    if (listing && listing.sellerId === sellerId) {
      r.sellerReply = replyText.trim();
      r.sellerRepliedAt = now;
      return true;
    }
  }
  return false;
}

export async function reportReview(
  reviewId: string,
  reporterId: string,
  reason: string,
): Promise<boolean> {
  const cleanReason = reason.trim();
  if (cleanReason.length < 5 || cleanReason.length > 500) {
    throw new Error("Alasan pelaporan harus antara 5 hingga 500 karakter.");
  }

  const pool = getPool();

  if (pool) {
    // 1. Fetch review to verify existence and check self-reporting
    const reviewRes = await pool.query(
      `SELECT id, buyer_id FROM public.reviews WHERE id = $1 LIMIT 1`,
      [reviewId],
    );
    if (reviewRes.rows.length === 0) {
      return false;
    }
    if (reviewRes.rows[0].buyer_id && reviewRes.rows[0].buyer_id === reporterId) {
      throw new Error("Pelapor tidak boleh melaporkan ulasannya sendiri.");
    }

    // 2. Structured report insert with idempotency (upsert)
    await pool.query(
      `INSERT INTO public.review_reports (review_id, reporter_id, reason, status)
       VALUES ($1, $2, $3, 'open')
       ON CONFLICT (review_id, reporter_id)
       DO UPDATE SET reason = EXCLUDED.reason, status = 'open'`,
      [reviewId, reporterId, cleanReason],
    );

    // 3. Count distinct open reports
    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT reporter_id) as count
       FROM public.review_reports
       WHERE review_id = $1 AND status = 'open'`,
      [reviewId],
    );
    const reportCount = Number(countRes.rows[0]?.count || 0);

    // Threshold: >= 3 distinct reporters -> hidden_pending_review
    if (reportCount >= 3) {
      await pool.query(
        `UPDATE public.reviews
         SET is_reported = true, report_reason = $1, moderation_status = 'hidden_pending_review'
         WHERE id = $2`,
        [cleanReason, reviewId],
      );
    } else {
      await pool.query(
        `UPDATE public.reviews
         SET is_reported = true, report_reason = $1
         WHERE id = $2`,
        [cleanReason, reviewId],
      );
    }
    return true;
  }

  // Mock implementation
  const r = mockReviews.find((rev) => rev.id === reviewId);
  if (!r) return false;
  if (r.buyerId && r.buyerId === reporterId) {
    throw new Error("Pelapor tidak boleh melaporkan ulasannya sendiri.");
  }

  const existing = mockReviewReports.find(
    (rep) => rep.reviewId === reviewId && rep.reporterId === reporterId,
  );
  if (existing) {
    existing.reason = cleanReason;
    existing.status = "open";
  } else {
    mockReviewReports.push({
      reviewId,
      reporterId,
      reason: cleanReason,
      status: "open",
      createdAt: new Date().toISOString(),
    });
  }

  const distinctReporters = new Set(
    mockReviewReports
      .filter((rep) => rep.reviewId === reviewId && rep.status === "open")
      .map((rep) => rep.reporterId),
  ).size;

  r.isReported = true;
  r.reportReason = cleanReason;
  if (distinctReporters >= 3) {
    r.moderationStatus = "hidden_pending_review";
  }

  return true;
}
