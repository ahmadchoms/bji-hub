import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export interface BrewRecipeInput {
  listingId: string;
  userId: string;
  method: string;
  doseGrams: number;
  waterMl: number;
  tempC?: number | null;
  brewTimeSeconds?: number | null;
  grindSize?: string | null;
  notes?: string | null;
}

export interface BrewRecipeDetail {
  id: string;
  listingId: string;
  userId: string;
  method: string;
  doseGrams: number;
  waterMl: number;
  tempC?: number | null;
  brewTimeSeconds?: number | null;
  grindSize?: string | null;
  notes?: string | null;
  votesCount: number;
  createdAt: string;
}

/**
 * Creates a community brew recipe following D3 rules:
 * - Only verified buyers with a 'completed' order can submit
 * - Maximum 3 recipes per user per listing
 */
export async function createBrewRecipe(
  input: BrewRecipeInput
): Promise<{ success: boolean; recipeId?: string; error?: string }> {
  const pool = getPool();
  if (!pool) return { success: false, error: "Database tidak tersedia" };

  try {
    // 1. Verify user has completed order for this listing
    const orderRes = await pool.query(
      `SELECT id FROM public.orders
       WHERE buyer_id = $1 AND listing_id = $2 AND status = 'completed'
       LIMIT 1`,
      [input.userId, input.listingId]
    );

    if (orderRes.rows.length === 0) {
      return {
        success: false,
        error: "Hanya pembeli yang telah menyelesaikan pesanan kopi ini yang dapat membagikan resep",
      };
    }

    // 2. Check recipe count limit (max 3 per user per product)
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.brew_recipes WHERE user_id = $1 AND listing_id = $2`,
      [input.userId, input.listingId]
    );

    if (Number(countRes.rows[0]?.count || 0) >= 3) {
      return {
        success: false,
        error: "Batas maksimal 3 resep per produk telah tercapai",
      };
    }

    // 3. Insert recipe
    const insertRes = await pool.query(
      `INSERT INTO public.brew_recipes (
         listing_id, user_id, method, dose_grams, water_ml, temp_c,
         brew_time_seconds, grind_size, notes, status, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', NOW())
       RETURNING id`,
      [
        input.listingId,
        input.userId,
        input.method,
        input.doseGrams,
        input.waterMl,
        input.tempC ?? null,
        input.brewTimeSeconds ?? null,
        input.grindSize ?? null,
        input.notes ?? null,
      ]
    );

    return { success: true, recipeId: insertRes.rows[0].id };
  } catch (err) {
    logger.error(
      "recipes.create_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return { success: false, error: "Gagal menyimpan resep" };
  }
}

/**
 * Retrieves top community brew recipes for a product ranked by helpful votes.
 */
export async function getTopBrewRecipesForListing(
  listingId: string,
  limit: number = 3
): Promise<BrewRecipeDetail[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const res = await pool.query(
      `SELECT br.id, br.listing_id, br.user_id, br.method, br.dose_grams,
              br.water_ml, br.temp_c, br.brew_time_seconds, br.grind_size,
              br.notes, br.created_at::text,
              COUNT(brv.id)::int AS votes_count
       FROM public.brew_recipes br
       LEFT JOIN public.brew_recipe_votes brv ON br.id = brv.recipe_id
       WHERE br.listing_id = $1 AND br.status = 'approved'
       GROUP BY br.id
       ORDER BY votes_count DESC, br.created_at DESC
       LIMIT $2`,
      [listingId, limit]
    );

    return res.rows.map((r) => ({
      id: r.id,
      listingId: r.listing_id,
      userId: r.user_id,
      method: r.method,
      doseGrams: Number(r.dose_grams),
      waterMl: Number(r.water_ml),
      tempC: r.temp_c ? Number(r.temp_c) : null,
      brewTimeSeconds: r.brew_time_seconds ? Number(r.brew_time_seconds) : null,
      grindSize: r.grind_size,
      notes: r.notes,
      votesCount: Number(r.votes_count),
      createdAt: r.created_at,
    }));
  } catch (err) {
    logger.error(
      "recipes.get_top_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return [];
  }
}

/**
 * Toggles a helpful vote on a community brew recipe.
 */
export async function voteBrewRecipe(
  recipeId: string,
  userId: string
): Promise<{ success: boolean; voteCount: number; userVoted: boolean }> {
  const pool = getPool();
  if (!pool) return { success: false, voteCount: 0, userVoted: false };

  try {
    const existing = await pool.query(
      `SELECT id FROM public.brew_recipe_votes WHERE recipe_id = $1 AND user_id = $2`,
      [recipeId, userId]
    );

    let userVoted = false;
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM public.brew_recipe_votes WHERE recipe_id = $1 AND user_id = $2`,
        [recipeId, userId]
      );
      userVoted = false;
    } else {
      await pool.query(
        `INSERT INTO public.brew_recipe_votes (recipe_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [recipeId, userId]
      );
      userVoted = true;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.brew_recipe_votes WHERE recipe_id = $1`,
      [recipeId]
    );

    return {
      success: true,
      voteCount: Number(countRes.rows[0]?.count || 0),
      userVoted,
    };
  } catch (err) {
    logger.error(
      "recipes.vote_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return { success: false, voteCount: 0, userVoted: false };
  }
}
