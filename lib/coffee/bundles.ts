import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export interface BundleItemDetail {
  id: string;
  bundleListingId: string;
  childListingId: string;
  quantity: number;
  childTitle?: string;
  childStock?: number;
}

/**
 * Calculates effective available stock for a bundle listing.
 * Formula: MIN(floor(child.stock / bundleItem.quantity)) across all child items.
 */
export async function getBundleEffectiveStock(
  bundleListingId: string
): Promise<number | null> {
  const pool = getPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT MIN(FLOOR(COALESCE(l.stock, 0)::float / GREATEST(1, b.quantity)))::int AS effective_stock
       FROM public.bundle_items b
       JOIN public.listings l ON b.child_listing_id = l.id
       WHERE b.bundle_listing_id = $1`,
      [bundleListingId]
    );

    if (res.rows.length === 0 || res.rows[0].effective_stock === null) {
      return null;
    }

    return Math.max(0, Number(res.rows[0].effective_stock));
  } catch (err) {
    logger.error(
      "bundles.get_effective_stock_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return null;
  }
}

/**
 * Retrieves children listings belonging to a tasting bundle.
 */
export async function getBundleItems(
  bundleListingId: string
): Promise<BundleItemDetail[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const res = await pool.query(
      `SELECT b.id, b.bundle_listing_id, b.child_listing_id, b.quantity, l.title AS child_title, l.stock AS child_stock
       FROM public.bundle_items b
       JOIN public.listings l ON b.child_listing_id = l.id
       WHERE b.bundle_listing_id = $1
       ORDER BY b.created_at ASC`,
      [bundleListingId]
    );

    return res.rows.map((r) => ({
      id: r.id,
      bundleListingId: r.bundle_listing_id,
      childListingId: r.child_listing_id,
      quantity: Number(r.quantity),
      childTitle: r.child_title,
      childStock: Number(r.child_stock),
    }));
  } catch (err) {
    logger.error(
      "bundles.get_items_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return [];
  }
}
