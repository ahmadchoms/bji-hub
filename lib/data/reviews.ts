import { logger } from "@/lib/logger";
import { getPool } from "@/lib/db/pool";
import type { Review } from "@/types";
import { mockListings } from "@/lib/mock/data";

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
  await syncListingRating(data.listingId);
  return newReview;
}

export async function syncListingRating(listingId: string): Promise<void> {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `WITH agg AS (
          SELECT
            ROUND(AVG(rating)::numeric, 2) AS avg_rating,
            COUNT(*)::int AS cnt
          FROM public.reviews
          WHERE listing_id = $1 AND (moderation_status = 'approved' OR moderation_status IS NULL)
        )
        UPDATE public.listings l
        SET rating_avg = agg.avg_rating, rating_count = agg.cnt
        FROM agg
        WHERE l.id = $1`,
        [listingId],
      );
    } catch (e) {
      logger.error("reviews.sync_rating_failed", e, { listingId });
    }
  }

  const activeReviews = mockReviews.filter(
    (r) => r.listingId === listingId && r.moderationStatus !== "hidden_pending_review",
  );
  const count = activeReviews.length;
  const avg =
    count > 0
      ? Number(
          (
            activeReviews.reduce((sum, r) => sum + r.rating, 0) / count
          ).toFixed(2),
        )
      : null;

  const target = mockListings.find((l) => l.id === listingId);
  if (target) {
    target.ratingAvg = avg;
    target.ratingCount = count;
  }
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

export interface MockReporterConfig {
  createdAt?: string;
  completedOrdersCount?: number;
}

const mockReporterConfigs = new Map<string, MockReporterConfig>();

export function _configureMockReporter(
  reporterId: string,
  config: MockReporterConfig,
): void {
  mockReporterConfigs.set(reporterId, config);
}

export function _resetMockReviewsForTest(): void {
  mockReviews.length = 0;
  mockReviewReports.length = 0;
  mockReporterConfigs.clear();
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
    adminApprovedAt: row.admin_approved_at
      ? new Date(row.admin_approved_at as string).toISOString()
      : (row.adminApprovedAt as string | null) ?? null,
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
           AND l."sellerId" = $4
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
    // 1. Fetch review to verify existence and check self-reporting and store owner
    const reviewRes = await pool.query(
      `SELECT
         r.id,
         r.buyer_id,
         r.listing_id,
         r.admin_approved_at,
         s."userId" as seller_user_id
       FROM public.reviews r
       JOIN public.listings l ON l.id = r.listing_id
       JOIN public.seller_profiles s ON s.id = l."sellerId"
       WHERE r.id = $1 LIMIT 1`,
      [reviewId],
    );
    if (reviewRes.rows.length === 0) {
      return false;
    }
    const reviewRow = reviewRes.rows[0];

    if (reviewRow.buyer_id && reviewRow.buyer_id === reporterId) {
      throw new Error("Pelapor tidak boleh melaporkan ulasannya sendiri.");
    }
    if (reviewRow.seller_user_id && reviewRow.seller_user_id === reporterId) {
      throw new Error("Pemilik toko tidak dapat melaporkan ulasan pada produk sendiri.");
    }

    // 2. Check reporter account age (>= 7 days) and completed orders (>= 1)
    const reporterRes = await pool.query(
      `SELECT
         u."createdAt",
         COUNT(o.id) FILTER (WHERE o.status = 'completed') as completed_orders
       FROM public.users u
       LEFT JOIN public.orders o ON o.buyer_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, u."createdAt"`,
      [reporterId],
    );
    if (reporterRes.rows.length > 0) {
      const reporterRow = reporterRes.rows[0];
      const createdAtVal = reporterRow.createdAt || reporterRow.created_at;
      const ageDays = (Date.now() - new Date(createdAtVal).getTime()) / (24 * 60 * 60 * 1000);
      if (ageDays < 7) {
        throw new Error("Akun Anda harus berumur minimal 7 hari untuk dapat melaporkan ulasan.");
      }
      if (Number(reporterRow.completed_orders || 0) < 1) {
        throw new Error("Anda harus memiliki minimal 1 pesanan selesai untuk dapat melaporkan ulasan.");
      }
    }

    // 3. Check existing report status (do not reopen dismissed/actioned reports)
    const existingRes = await pool.query(
      `SELECT status FROM public.review_reports WHERE review_id = $1 AND reporter_id = $2 LIMIT 1`,
      [reviewId, reporterId],
    );
    if (existingRes.rows.length > 0) {
      const status = existingRes.rows[0].status;
      if (status === "dismissed" || status === "actioned") {
        throw new Error("Laporan Anda sudah ditinjau.");
      }
    }

    // 4. Structured report insert with idempotency (upsert)
    await pool.query(
      `INSERT INTO public.review_reports (review_id, reporter_id, reason, status, created_at)
       VALUES ($1, $2, $3, 'open', NOW())
       ON CONFLICT (review_id, reporter_id)
       DO UPDATE SET reason = EXCLUDED.reason
       WHERE public.review_reports.status = 'open'`,
      [reviewId, reporterId, cleanReason],
    );

    // 5. Count distinct eligible open reports created after admin_approved_at
    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT rr.reporter_id) as count
       FROM public.review_reports rr
       JOIN public.users u ON u.id = rr.reporter_id
       JOIN (
         SELECT buyer_id FROM public.orders WHERE status = 'completed' GROUP BY buyer_id
       ) co ON co.buyer_id = rr.reporter_id
       WHERE rr.review_id = $1
         AND rr.status = 'open'
         AND u."createdAt" <= NOW() - INTERVAL '7 days'
         AND ($2::timestamptz IS NULL OR rr.created_at > $2::timestamptz)`,
      [reviewId, reviewRow.admin_approved_at || null],
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
      if (reviewRow.buyer_id) {
        try {
          const { createNotification } = await import("@/lib/data/notifications");
          await createNotification({
            userId: reviewRow.buyer_id,
            title: "Ulasan Anda Sedang Ditinjau",
            message: "Ulasan Anda pada produk sedang ditinjau oleh tim moderasi karena adanya laporan.",
            type: "system",
          });
        } catch {
          // ignore: non-blocking notification failure
        }
      }
      if (reviewRow.listing_id) {
        await syncListingRating(reviewRow.listing_id);
      }
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
  const { mockListings, mockSellers } = await import("@/lib/mock/data");
  const { mockOrders } = await import("@/lib/data/orders");

  const r = mockReviews.find((rev) => rev.id === reviewId);
  if (!r) return false;

  // 1. Cannot report own review
  if (r.buyerId && r.buyerId === reporterId) {
    throw new Error("Pelapor tidak boleh melaporkan ulasannya sendiri.");
  }

  // 2. Listing owner cannot report reviews on their own listing
  const listing = mockListings.find((l) => l.id === r.listingId);
  const seller = listing ? mockSellers.find((s) => s.id === listing.sellerId) : null;
  if (seller && (seller.userId === reporterId || seller.id === reporterId)) {
    throw new Error("Pemilik toko tidak dapat melaporkan ulasan pada produk sendiri.");
  }

  // 3. Reporter eligibility: account age >= 7 days and >= 1 completed orders
  const reporterCfg = mockReporterConfigs.get(reporterId);
  const accountAgeDays = reporterCfg?.createdAt
    ? (Date.now() - new Date(reporterCfg.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    : 30; // default to mature account unless test explicitly configures recent

  if (accountAgeDays < 7) {
    throw new Error("Akun Anda harus berumur minimal 7 hari untuk dapat melaporkan ulasan.");
  }

  const completedCount =
    reporterCfg?.completedOrdersCount !== undefined
      ? reporterCfg.completedOrdersCount
      : mockOrders.filter(
          (o) => o.buyerId === reporterId && o.status === "completed",
        ).length || 1; // default to 1 order unless test explicitly configures 0

  if (completedCount < 1) {
    throw new Error("Anda harus memiliki minimal 1 pesanan selesai untuk dapat melaporkan ulasan.");
  }

  // 4. Do not reopen dismissed or actioned reports
  const existing = mockReviewReports.find(
    (rep) => rep.reviewId === reviewId && rep.reporterId === reporterId,
  );
  if (existing) {
    if (existing.status === "dismissed" || existing.status === "actioned") {
      throw new Error("Laporan Anda sudah ditinjau.");
    }
    existing.reason = cleanReason;
  } else {
    mockReviewReports.push({
      reviewId,
      reporterId,
      reason: cleanReason,
      status: "open",
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Count distinct open reports created after adminApprovedAt (if any)
  const approvedAt = r.adminApprovedAt ? new Date(r.adminApprovedAt).getTime() : 0;
  const eligibleReports = mockReviewReports.filter(
    (rep) =>
      rep.reviewId === reviewId &&
      rep.status === "open" &&
      new Date(rep.createdAt).getTime() > approvedAt,
  );
  const distinctReporters = new Set(eligibleReports.map((rep) => rep.reporterId)).size;

  r.isReported = true;
  r.reportReason = cleanReason;
  if (distinctReporters >= 3) {
    r.moderationStatus = "hidden_pending_review";
    if (r.buyerId) {
      try {
        const { createNotification } = await import("@/lib/data/notifications");
        await createNotification({
          userId: r.buyerId,
          title: "Ulasan Anda Sedang Ditinjau",
          message: "Ulasan Anda pada produk sedang ditinjau oleh tim moderasi karena adanya laporan.",
          type: "system",
        });
      } catch {
        // ignore: non-blocking notification failure
      }
    }
    await syncListingRating(r.listingId);
  }

  return true;
}

export async function adminApproveReview(reviewId: string): Promise<boolean> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.reviews
         SET moderation_status = 'approved', is_reported = false, admin_approved_at = $1
         WHERE id = $2
         RETURNING listing_id`,
        [now, reviewId],
      );
      if (res.rows.length === 0) return false;
      await pool.query(
        `UPDATE public.review_reports
         SET status = 'dismissed'
         WHERE review_id = $1 AND status = 'open'`,
        [reviewId],
      );
      if (res.rows[0].listing_id) {
        await syncListingRating(res.rows[0].listing_id);
      }
      return true;
    } catch (e) {
      logger.error("reviews.admin_approve_failed", e, { reviewId });
      return false;
    }
  }

  const r = mockReviews.find((rev) => rev.id === reviewId);
  if (!r) return false;
  r.moderationStatus = "approved";
  r.isReported = false;
  r.adminApprovedAt = now;
  for (const rep of mockReviewReports) {
    if (rep.reviewId === reviewId && rep.status === "open") {
      rep.status = "dismissed";
    }
  }
  await syncListingRating(r.listingId);
  return true;
}
