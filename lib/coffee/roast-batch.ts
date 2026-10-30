import { runAfterResponse } from "@/lib/after";
import { revalidateListing } from "@/lib/cache/revalidate";
import { sendWaitlistRestockedEmail } from "@/lib/email";
import { createNotification } from "@/lib/data/notifications";
import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
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
  const isProd = process.env.NODE_ENV === "production";
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
    } catch (error) {
      if (isProd) {
        logger.error("roast_batch.get_failed", error);
        throw error;
      }
    }
  }

  if (isProd) return [];
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
  const isProd = process.env.NODE_ENV === "production";
  const pool = getPool();
  const now = new Date().toISOString();

  let createdBatch: RoastBatch;

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert without string id, letting DB generate uuid default (F3)
      const insertRes = await client.query(
        `INSERT INTO public.roast_batches (id, listing_id, roasted_on, quantity_kg, notes, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         RETURNING id, created_at`,
        [params.listingId, params.roastedOn, params.quantityKg || null, params.notes || null]
      );

      const row = insertRes.rows[0];
      const batchId = row.id;
      const createdAt = new Date(row.created_at).toISOString();

      // Derive roast date on taste_profiles from this batch
      await client.query(
        `UPDATE public.taste_profiles
         SET roast_date = $1
         WHERE listing_id = $2`,
        [`${params.roastedOn}T00:00:00+07:00`, params.listingId]
      );

      await client.query("COMMIT");

      createdBatch = {
        id: batchId,
        listingId: params.listingId,
        roastedOn: params.roastedOn,
        quantityKg: params.quantityKg ?? null,
        notes: params.notes ?? null,
        createdAt,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      if (isProd) {
        logger.error("roast_batch.add_failed", error);
        throw error;
      }
      // Fallback in dev/test when DB is unmigrated
      createdBatch = {
        id: `batch-${Date.now()}`,
        listingId: params.listingId,
        roastedOn: params.roastedOn,
        quantityKg: params.quantityKg ?? null,
        notes: params.notes ?? null,
        createdAt: now,
      };
    } finally {
      client.release();
    }
  } else {
    if (isProd) {
      throw new Error("Database pool is required in production");
    }
    createdBatch = {
      id: `batch-${Date.now()}`,
      listingId: params.listingId,
      roastedOn: params.roastedOn,
      quantityKg: params.quantityKg ?? null,
      notes: params.notes ?? null,
      createdAt: now,
    };
  }

  mockRoastBatches.unshift(createdBatch);

  // Invalidate listing cache immediately (N1)
  revalidateListing(params.listingSlug);

  // Notify waitlist subscribers asynchronously in pages of 100 with allSettled (F3)
  runAfterResponse(async () => {
    try {
      if (pool) {
        const waitlistRes = await pool.query(
          `SELECT w.user_id, u.email
           FROM public.listing_waitlist w
           JOIN public.users u ON u.id = w.user_id
           WHERE w.listing_id = $1 AND w.notified_at IS NULL
           LIMIT 100`,
          [params.listingId]
        );

        const subscribers = waitlistRes.rows.map((r) => ({
          userId: r.user_id,
          email: r.email,
        }));

        if (subscribers.length > 0) {
          const title = params.listingTitle || "Kopi Favoritmu";
          const successfulUserIds: string[] = [];

          const results = await Promise.allSettled(
            subscribers.map(async (sub) => {
              await createNotification({
                userId: sub.userId,
                title: "Batch Sangrai Baru Tersedia! ☕",
                message: `Batch sangrai baru untuk "${title}" (${params.roastedOn}) kini siap dipesan. Segera amankan stokmu!`,
                type: "system",
                link: params.listingSlug ? `/product/${params.listingSlug}` : "/",
              });

              if (sub.email) {
                await sendWaitlistRestockedEmail({
                  to: sub.email,
                  listingTitle: title,
                  listingSlug: params.listingSlug,
                  roastDate: params.roastedOn,
                });
              }
              return sub.userId;
            })
          );

          for (const res of results) {
            if (res.status === "fulfilled" && res.value) {
              successfulUserIds.push(res.value);
            }
          }

          // Mark notified_at ONLY for successfully delivered subscribers (F3)
          if (successfulUserIds.length > 0) {
            await pool.query(
              `UPDATE public.listing_waitlist
               SET notified_at = NOW()
               WHERE listing_id = $1 AND user_id = ANY($2)`,
              [params.listingId, successfulUserIds]
            );
          }
        }
      }
    } catch (err) {
      logger.warn("roast_batch.waitlist_notify_failed", { error: String(err) });
    }
  });

  return createdBatch;
}
