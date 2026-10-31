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
  if (!pool) return baseUnitPrice;

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
  if (!pool) return [];

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
 * Retrieves technical green bean specifications for a listing.
 */
export async function getGreenBeanSpecs(
  listingId: string
): Promise<GreenBeanSpecDetail | null> {
  const pool = getPool();
  if (!pool) return null;

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
  if (!pool) return false;

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
