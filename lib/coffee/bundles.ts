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

export const mockBundleItems: BundleItemDetail[] = [];

/**
 * Calculates effective available stock for a bundle listing.
 * Formula: MIN(floor(child.stock / bundleItem.quantity)) across all child items.
 */
export async function getBundleEffectiveStock(
  bundleListingId: string
): Promise<number | null> {
  const pool = getPool();
  if (!pool) {
    const items = mockBundleItems.filter((b) => b.bundleListingId === bundleListingId);
    if (items.length === 0) return null;
    let minEffective = Infinity;
    for (const it of items) {
      const childStock = it.childStock ?? 0;
      const effective = Math.floor(childStock / Math.max(1, it.quantity));
      if (effective < minEffective) minEffective = effective;
    }
    return minEffective === Infinity ? 0 : Math.max(0, minEffective);
  }

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
  if (!pool) {
    return mockBundleItems.filter((b) => b.bundleListingId === bundleListingId);
  }

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

/**
 * Saves child listings in a bundle with strict validation (2-5 children, same seller, active, no nested bundles).
 */
export async function saveBundleItems(
  bundleListingId: string,
  sellerProfileId: string,
  items: Array<{ childListingId: string; quantity: number }>,
): Promise<boolean> {
  if (items.length < 2 || items.length > 5) {
    throw new Error("Paket bundle harus terdiri dari 2 hingga 5 varian produk");
  }

  const seenChildren = new Set<string>();
  for (const item of items) {
    if (seenChildren.has(item.childListingId)) {
      throw new Error("Produk dalam paket tidak boleh duplikat");
    }
    seenChildren.add(item.childListingId);
    if (item.childListingId === bundleListingId) {
      throw new Error("Paket tidak dapat memasukkan dirinya sendiri sebagai anak");
    }
    if (item.quantity < 1) {
      throw new Error("Jumlah setiap produk dalam paket minimal 1");
    }
  }

  const pool = getPool();
  if (!pool) {
    for (let i = mockBundleItems.length - 1; i >= 0; i--) {
      if (mockBundleItems[i].bundleListingId === bundleListingId) {
        mockBundleItems.splice(i, 1);
      }
    }
    for (const it of items) {
      mockBundleItems.push({
        id: `bi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bundleListingId,
        childListingId: it.childListingId,
        quantity: it.quantity,
      });
    }
    return true;
  }

  try {
    // 1. Verify bundle listing ownership
    const bundleRes = await pool.query(
      `SELECT id, kind FROM public.listings WHERE id = $1 AND "sellerId" = $2`,
      [bundleListingId, sellerProfileId],
    );
    if (bundleRes.rows.length === 0) {
      throw new Error("Hanya pemilik toko yang dapat mengatur isi paket");
    }

    // 2. Verify all child listings belong to same seller, are active, and are not bundles (prevent recursion)
    for (const item of items) {
      const childRes = await pool.query(
        `SELECT id, status, kind FROM public.listings WHERE id = $1 AND "sellerId" = $2`,
        [item.childListingId, sellerProfileId],
      );
      if (childRes.rows.length === 0) {
        throw new Error("Produk dalam paket harus milik toko Anda sendiri");
      }
      const child = childRes.rows[0];
      if (child.status !== "active") {
        throw new Error("Produk dalam paket harus berstatus aktif");
      }
      if (child.kind === "bundle") {
        throw new Error("Produk paket tidak dapat dijadikan isi dari paket lain (tidak boleh bertingkat)");
      }
    }

    // 3. Atomically replace bundle items and set kind = 'bundle'
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`UPDATE public.listings SET kind = 'bundle' WHERE id = $1`, [bundleListingId]);
      await client.query(`DELETE FROM public.bundle_items WHERE bundle_listing_id = $1`, [bundleListingId]);

      for (const item of items) {
        await client.query(
          `INSERT INTO public.bundle_items (bundle_listing_id, child_listing_id, quantity, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [bundleListingId, item.childListingId, item.quantity],
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error(
      "bundles.save_bundle_items_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    throw err;
  }
}
