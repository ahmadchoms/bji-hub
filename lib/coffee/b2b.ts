import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export interface PriceTierDetail {
  id: string;
  listingId: string;
  minQty: number;
  unitPrice: number;
}

export interface GreenBeanSpecDetail {
  listingId: string;
  screenSize?: string | null;
  moisturePct?: number | null;
  densityGl?: number | null;
  waterActivity?: number | null;
  primaryDefects?: number | null;
  secondaryDefects?: number | null;
  coaUrl?: string | null;
}

export const mockPriceTiers: PriceTierDetail[] = [];
export const mockGreenBeanSpecs: GreenBeanSpecDetail[] = [];

/**
 * Calculates effective unit price on the server according to volume price tiers.
 * If quantity reaches tier threshold, the tiered price is used.
 * Server-only computation prevents client price tampering (D9 Acceptance).
 */
export async function getEffectiveTieredPrice(
  listingId: string,
  quantity: number,
  baseUnitPrice: number
): Promise<number> {
  const pool = getPool();
  if (!pool) {
    const tiers = mockPriceTiers
      .filter((t) => t.listingId === listingId && t.minQty <= quantity)
      .sort((a, b) => b.minQty - a.minQty);
    return tiers[0]?.unitPrice ?? baseUnitPrice;
  }

  try {
    const res = await pool.query(
      `SELECT unit_price
       FROM public.price_tiers
       WHERE listing_id = $1 AND min_qty <= $2
       ORDER BY min_qty DESC
       LIMIT 1`,
      [listingId, quantity]
    );

    if (res.rows.length > 0 && res.rows[0].unit_price !== null) {
      return Number(res.rows[0].unit_price);
    }

    return baseUnitPrice;
  } catch (err) {
    logger.error(
      "b2b.get_tiered_price_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return baseUnitPrice;
  }
}

/**
 * Retrieves all price tiers for a listing.
 */
export async function getPriceTiers(
  listingId: string
): Promise<PriceTierDetail[]> {
  const pool = getPool();
  if (!pool) {
    return mockPriceTiers
      .filter((t) => t.listingId === listingId)
      .sort((a, b) => a.minQty - b.minQty);
  }

  try {
    const res = await pool.query(
      `SELECT id, listing_id, min_qty, unit_price
       FROM public.price_tiers
       WHERE listing_id = $1
       ORDER BY min_qty ASC`,
      [listingId]
    );

    return res.rows.map((r) => ({
      id: r.id,
      listingId: r.listing_id,
      minQty: Number(r.min_qty),
      unitPrice: Number(r.unit_price),
    }));
  } catch (err) {
    logger.error(
      "b2b.get_price_tiers_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return [];
  }
}

/**
 * Saves monotonic tiered prices for a listing.
 */
export async function savePriceTiers(
  listingId: string,
  sellerProfileId: string,
  tiers: Array<{ minQty: number; unitPrice: number }>,
): Promise<boolean> {
  const pool = getPool();

  if (!pool) {
    // Validate monotonic rules in mock
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (t.minQty < 2) {
        throw new Error("Jumlah minimum harga bertingkat minimal 2");
      }
      if (i > 0) {
        const prev = tiers[i - 1];
        if (t.minQty <= prev.minQty) {
          throw new Error("Jumlah minimum (min_qty) harus bertambah naik di setiap tier");
        }
        if (t.unitPrice >= prev.unitPrice) {
          throw new Error("Harga satuan (unit_price) harus semakin murah (turun) seiring bertambahnya jumlah");
        }
      }
    }
    // Replace mock tiers
    for (let i = mockPriceTiers.length - 1; i >= 0; i--) {
      if (mockPriceTiers[i].listingId === listingId) {
        mockPriceTiers.splice(i, 1);
      }
    }
    for (const t of tiers) {
      mockPriceTiers.push({
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        listingId,
        minQty: t.minQty,
        unitPrice: t.unitPrice,
      });
    }
    return true;
  }

  try {
    // 1. Ownership check
    const ownerRes = await pool.query(
      `SELECT id, price FROM public.listings WHERE id = $1 AND "sellerId" = $2`,
      [listingId, sellerProfileId],
    );
    if (ownerRes.rows.length === 0) {
      throw new Error("Hanya pemilik toko yang dapat mengatur harga bertingkat");
    }
    const basePrice = Number(ownerRes.rows[0].price);

    // 2. Validate monotonic constraint
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (t.minQty < 2) {
        throw new Error("Jumlah minimum harga bertingkat minimal 2");
      }
      if (t.unitPrice >= basePrice) {
        throw new Error(`Harga bertingkat (Rp${t.unitPrice.toLocaleString()}) harus lebih murah dari harga dasar (Rp${basePrice.toLocaleString()})`);
      }
      if (i > 0) {
        const prev = tiers[i - 1];
        if (t.minQty <= prev.minQty) {
          throw new Error("Jumlah minimum (min_qty) harus bertambah naik di setiap tier");
        }
        if (t.unitPrice >= prev.unitPrice) {
          throw new Error("Harga satuan (unit_price) harus semakin murah (turun) seiring bertambahnya jumlah");
        }
      }
    }

    // 3. Atomically replace tiers
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM public.price_tiers WHERE listing_id = $1`, [listingId]);

      for (const t of tiers) {
        await client.query(
          `INSERT INTO public.price_tiers (listing_id, min_qty, unit_price, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [listingId, t.minQty, t.unitPrice],
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
      "b2b.save_price_tiers_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    throw err;
  }
}

/**
 * Retrieves technical green bean specifications for a listing.
 */
export async function getGreenBeanSpecs(
  listingId: string
): Promise<GreenBeanSpecDetail | null> {
  const pool = getPool();
  if (!pool) {
    return mockGreenBeanSpecs.find((s) => s.listingId === listingId) ?? null;
  }

  try {
    const res = await pool.query(
      `SELECT listing_id, screen_size, moisture_pct, density_gl, water_activity,
              primary_defects, secondary_defects, coa_url
       FROM public.green_bean_specs
       WHERE listing_id = $1`,
      [listingId]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    return {
      listingId: r.listing_id,
      screenSize: r.screen_size,
      moisturePct: r.moisture_pct ? Number(r.moisture_pct) : null,
      densityGl: r.density_gl ? Number(r.density_gl) : null,
      waterActivity: r.water_activity ? Number(r.water_activity) : null,
      primaryDefects: r.primary_defects !== null ? Number(r.primary_defects) : null,
      secondaryDefects: r.secondary_defects !== null ? Number(r.secondary_defects) : null,
      coaUrl: r.coa_url,
    };
  } catch (err) {
    logger.error(
      "b2b.get_green_specs_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return null;
  }
}

/**
 * Saves green bean specs ensuring that only the listing seller can modify (D9 Acceptance).
 */
export async function saveGreenBeanSpecs(
  listingId: string,
  sellerProfileId: string,
  specs: Omit<GreenBeanSpecDetail, "listingId">
): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    const idx = mockGreenBeanSpecs.findIndex((s) => s.listingId === listingId);
    const item: GreenBeanSpecDetail = { listingId, ...specs };
    if (idx >= 0) mockGreenBeanSpecs[idx] = item;
    else mockGreenBeanSpecs.push(item);
    return true;
  }

  try {
    // 1. Verify seller ownership
    const ownerRes = await pool.query(
      `SELECT id FROM public.listings WHERE id = $1 AND "sellerId" = $2`,
      [listingId, sellerProfileId]
    );

    if (ownerRes.rows.length === 0) {
      throw new Error("Hanya pemilik toko yang dapat mengisi spesifikasi green bean");
    }

    // 2. Upsert specs
    await pool.query(
      `INSERT INTO public.green_bean_specs (
         listing_id, screen_size, moisture_pct, density_gl, water_activity,
         primary_defects, secondary_defects, coa_url, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (listing_id)
       DO UPDATE SET
         screen_size = EXCLUDED.screen_size,
         moisture_pct = EXCLUDED.moisture_pct,
         density_gl = EXCLUDED.density_gl,
         water_activity = EXCLUDED.water_activity,
         primary_defects = EXCLUDED.primary_defects,
         secondary_defects = EXCLUDED.secondary_defects,
         coa_url = EXCLUDED.coa_url`,
      [
        listingId,
        specs.screenSize ?? null,
        specs.moisturePct ?? null,
        specs.densityGl ?? null,
        specs.waterActivity ?? null,
        specs.primaryDefects ?? null,
        specs.secondaryDefects ?? null,
        specs.coaUrl ?? null,
      ]
    );

    return true;
  } catch (err) {
    logger.error(
      "b2b.save_green_specs_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    throw err;
  }
}
