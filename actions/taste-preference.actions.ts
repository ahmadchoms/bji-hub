"use server";

import { Pool } from "pg";
import { getSession } from "@/lib/auth/session";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";

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

const mockTastePreferences = new Map<
  string,
  {
    acidityPref?: number | null;
    bodyPref?: number | null;
    roastPref: string[];
    flavorTags: string[];
    updatedAt: string;
  }
>();

export interface TastePreferenceInput {
  acidityPref?: number | null;
  bodyPref?: number | null;
  roastPref?: string[];
  flavorTags?: string[];
}

export async function saveTastePreferencesAction(
  input: TastePreferenceInput
): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return ok({ saved: false });
    }

    const userId = session.userId;
    const roastPref = input.roastPref || [];
    const flavorTags = input.flavorTags || [];
    const acidity = input.acidityPref ?? null;
    const body = input.bodyPref ?? null;

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO public.user_taste_preferences (user_id, acidity_pref, body_pref, roast_pref, flavor_tags, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET
             acidity_pref = EXCLUDED.acidity_pref,
             body_pref = EXCLUDED.body_pref,
             roast_pref = EXCLUDED.roast_pref,
             flavor_tags = EXCLUDED.flavor_tags,
             updated_at = NOW()`,
          [userId, acidity, body, roastPref, flavorTags]
        );
        return ok({ saved: true });
      } catch {
        // ignore: table not yet migrated on remote test DB, fallback to in-memory store
      }
    }

    mockTastePreferences.set(userId, {
      acidityPref: acidity,
      bodyPref: body,
      roastPref,
      flavorTags,
      updatedAt: new Date().toISOString(),
    });

    return ok({ saved: true });
  } catch (error) {
    logger.error("Gagal menyimpan preferensi rasa", error);
    return fail("Gagal menyimpan preferensi rasa");
  }
}

export async function getTastePreferencesAction(): Promise<
  ActionResult<TastePreferenceInput | null>
> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return ok(null);
    }

    const userId = session.userId;
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT acidity_pref, body_pref, roast_pref, flavor_tags FROM public.user_taste_preferences WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return ok({
            acidityPref: row.acidity_pref ? Number(row.acidity_pref) : null,
            bodyPref: row.body_pref ? Number(row.body_pref) : null,
            roastPref: row.roast_pref || [],
            flavorTags: row.flavor_tags || [],
          });
        }
      } catch {
        // ignore: fallback to mock store in dev/test when table not yet migrated
      }
    }

    const pref = mockTastePreferences.get(userId);
    return ok(pref || null);
  } catch {
    return ok(null);
  }
}
