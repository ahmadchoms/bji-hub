import { Pool } from "pg";
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
      console.error("Failed to insert review in postgres:", e);
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
}

export async function getReviewsByListing(listingId: string): Promise<Review[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM public.reviews
         WHERE listing_id = $1
         ORDER BY created_at DESC`,
        [listingId],
      );
      return res.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        listingId: row.listing_id,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        rating: Number(row.rating),
        comment: row.comment,
        imageUrl: row.image_url ?? null,
        createdAt: row.created_at,
      }));
    } catch {
      // ignore: reviews db query fallback to mock store in dev
      // Fall through
    }
  }

  return mockReviews.filter((r) => r.listingId === listingId);
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
      return res.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        listingId: row.listing_id,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        rating: Number(row.rating),
        comment: row.comment,
        imageUrl: row.image_url ?? null,
        createdAt: row.created_at,
      }));
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
