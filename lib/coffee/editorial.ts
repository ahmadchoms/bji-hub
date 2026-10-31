import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export interface EditorialPickDetail {
  id: string;
  listingId: string;
  curatorUserId?: string | null;
  curatorName?: string | null;
  note?: string | null;
  cuppedOn?: string | null;
  score?: number | null;
  expiresAt?: string | null;
  createdAt: string;
}

/**
 * Retrieves valid active editorial pick for a listing.
 * Returns null if non-existent or expired.
 */
export async function getActiveEditorialPickForListing(
  listingId: string
): Promise<EditorialPickDetail | null> {
  const pool = getPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT ep.id, ep.listing_id, ep.curator_user_id, ep.note, ep.cupped_on::text,
              ep.score, ep.expires_at::text, ep.created_at::text,
              u.email AS curator_email
       FROM public.editorial_picks ep
       LEFT JOIN public.users u ON ep.curator_user_id = u.id
       WHERE ep.listing_id = $1
         AND (ep.expires_at IS NULL OR ep.expires_at > NOW())
       LIMIT 1`,
      [listingId]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      listingId: row.listing_id,
      curatorUserId: row.curator_user_id,
      curatorName: row.curator_email ? row.curator_email.split("@")[0] : "Kurator Biji",
      note: row.note,
      cuppedOn: row.cupped_on,
      score: row.score ? Number(row.score) : null,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  } catch (err) {
    logger.error(
      "editorial.get_pick_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return null;
  }
}
