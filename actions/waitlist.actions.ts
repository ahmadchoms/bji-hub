"use server";

import { getSession } from "@/lib/auth/session";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { getPool } from "@/lib/db/pool";

// In-memory mock storage for waitlist entries
const mockWaitlistEntries = new Set<string>(); // key: `${userId}:${listingId}`

const MAX_WAITLIST_PER_USER = 20;

export async function joinWaitlistAction(
  listingId: string
): Promise<ActionResult<{ joined: boolean; waitlistCount?: number }>> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return fail("Silakan masuk akun terlebih dahulu untuk mendaftar antrean.");
    }

    const userId = session.userId;
    const pool = getPool();

    if (pool) {
      try {
        // Enforce max 20 active waitlist entries per user (COF-5)
        const countRes = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM public.listing_waitlist
           WHERE user_id = $1 AND notified_at IS NULL`,
          [userId]
        );
        const activeCount = countRes.rows[0]?.cnt ?? 0;
        if (activeCount >= MAX_WAITLIST_PER_USER) {
          return fail(`Batas antrean tercapai (maksimal ${MAX_WAITLIST_PER_USER} produk aktif per akun).`);
        }

        await pool.query(
          `INSERT INTO public.listing_waitlist (id, listing_id, user_id, created_at)
           VALUES (gen_random_uuid(), $1, $2, NOW())
           ON CONFLICT (listing_id, user_id)
           DO UPDATE SET notified_at = NULL`,
          [listingId, userId]
        );

        return ok({ joined: true });
      } catch {
        // ignore: fallback to mock store in dev/test
      }
    }

    // Mock store
    const key = `${userId}:${listingId}`;
    const userKeys = Array.from(mockWaitlistEntries).filter((k) =>
      k.startsWith(`${userId}:`)
    );
    if (userKeys.length >= MAX_WAITLIST_PER_USER && !mockWaitlistEntries.has(key)) {
      return fail(`Batas antrean tercapai (maksimal ${MAX_WAITLIST_PER_USER} produk aktif per akun).`);
    }

    mockWaitlistEntries.add(key);
    return ok({ joined: true });
  } catch (error) {
    logger.error("Gagal mendaftar antrean produk", error);
    return fail("Terjadi kesalahan saat mendaftar antrean.");
  }
}

export async function leaveWaitlistAction(
  listingId: string
): Promise<ActionResult<{ left: boolean }>> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return ok({ left: false });
    }

    const userId = session.userId;
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `DELETE FROM public.listing_waitlist WHERE listing_id = $1 AND user_id = $2`,
          [listingId, userId]
        );
      } catch {
        // ignore
      }
    }

    mockWaitlistEntries.delete(`${userId}:${listingId}`);
    return ok({ left: true });
  } catch (error) {
    logger.error("Gagal membatalkan antrean produk", error);
    return fail("Gagal membatalkan antrean.");
  }
}

export async function checkWaitlistStatusAction(
  listingId: string
): Promise<ActionResult<{ inWaitlist: boolean }>> {
  try {
    const session = await getSession();
    if (!session || !session.userId || session.role === "guest") {
      return ok({ inWaitlist: false });
    }

    const userId = session.userId;
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT 1 FROM public.listing_waitlist WHERE listing_id = $1 AND user_id = $2 AND notified_at IS NULL LIMIT 1`,
          [listingId, userId]
        );
        return ok({ inWaitlist: res.rows.length > 0 });
      } catch {
        // ignore
      }
    }

    return ok({ inWaitlist: mockWaitlistEntries.has(`${userId}:${listingId}`) });
  } catch {
    return ok({ inWaitlist: false });
  }
}
