import { runAfterResponse } from "@/lib/after";
import { revalidateListing } from "@/lib/cache/revalidate";
import { sendWaitlistRestockedEmail } from "@/lib/email";
import { createNotification } from "@/lib/data/notifications";
import { getPool } from "@/lib/db/pool";
import type { RoastBatch } from "@/types";

export const mockRoastBatches: RoastBatch[] = [
  {
    id: "batch-1",
    listingId: "list-1",
    roastedOn: "2026-10-25",
    quantityKg: 15.5,
    notes: "Batch sangrai optimal profil Light-Medium",
    createdAt: "2026-10-25T08:00:00.000Z",
  },
];

export async function getRoastBatches(listingId: string): Promise<RoastBatch[]> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, listing_id, roasted_on, quantity_kg, notes, created_at
         FROM public.roast_batches
         WHERE listing_id = $1
         ORDER BY roasted_on DESC`,
        [listingId]
      );
      return res.rows.map((r) => ({
        id: r.id,
        listingId: r.listing_id,
        roastedOn: typeof r.roasted_on === "string" ? r.roasted_on : new Date(r.roasted_on).toISOString().slice(0, 10),
        quantityKg: r.quantity_kg ? Number(r.quantity_kg) : null,
        notes: r.notes || null,
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch {
      // ignore: fallback to mock store in dev/test
    }
  }

  return mockRoastBatches.filter((b) => b.listingId === listingId);
}

export async function addRoastBatch(params: {
  listingId: string;
  roastedOn: string;
  quantityKg?: number | null;
  notes?: string | null;
  listingTitle?: string;
  listingSlug?: string;
}): Promise<RoastBatch> {
  const pool = getPool();
  const id = `batch-${Date.now()}`;
  const now = new Date().toISOString();

  const newBatch: RoastBatch = {
    id,
    listingId: params.listingId,
    roastedOn: params.roastedOn,
    quantityKg: params.quantityKg ?? null,
    notes: params.notes ?? null,
    createdAt: now,
  };

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.roast_batches (id, listing_id, roasted_on, quantity_kg, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, params.listingId, params.roastedOn, params.quantityKg || null, params.notes || null, now]
      );

      // Derive roast date from latest batch on taste_profiles
      await pool.query(
        `UPDATE public.taste_profiles
         SET roast_date = $1
         WHERE listing_id = $2`,
        [`${params.roastedOn}T00:00:00+07:00`, params.listingId]
      );
    } catch {
      // ignore: fallback to mock
    }
  }

  mockRoastBatches.unshift(newBatch);

  // Invalidate listing cache immediately (N1)
  revalidateListing(params.listingSlug);

  // Notify waitlist subscribers asynchronously via runAfterResponse (COF-5)
  runAfterResponse(async () => {
    try {
      let waitlistUsers: Array<{ userId: string; email?: string }> = [];
      if (pool) {
        const waitlistRes = await pool.query(
          `SELECT w.user_id, u.email
           FROM public.listing_waitlist w
           JOIN public.users u ON u.id = w.user_id
           WHERE w.listing_id = $1 AND w.notified_at IS NULL`,
          [params.listingId]
        );
        waitlistUsers = waitlistRes.rows.map((r) => ({
          userId: r.user_id,
          email: r.email,
        }));

        if (waitlistUsers.length > 0) {
          await pool.query(
            `UPDATE public.listing_waitlist
             SET notified_at = NOW()
             WHERE listing_id = $1 AND notified_at IS NULL`,
            [params.listingId]
          );
        }
      }

      const title = params.listingTitle || "Kopi Favoritmu";
      for (const subscriber of waitlistUsers) {
        // In-app notification
        await createNotification({
          userId: subscriber.userId,
          title: "Batch Sangrai Baru Tersedia! ☕",
          message: `Batch sangrai baru untuk "${title}" (${params.roastedOn}) kini siap dipesan. Segera amankan stokmu!`,
          type: "system",
          link: params.listingSlug ? `/product/${params.listingSlug}` : "/",
        });

        // Email notification if email exists
        if (subscriber.email) {
          await sendWaitlistRestockedEmail({
            to: subscriber.email,
            listingTitle: title,
            listingSlug: params.listingSlug,
            roastDate: params.roastedOn,
          });
        }
      }
    } catch {
      // ignore: background waitlist notify failure
    }
  });

  return newBatch;
}
