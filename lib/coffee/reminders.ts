import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/data/notifications";
import { asUserId } from "@/types/ids";

export interface UserNotificationPref {
  userId: string;
  reminders: boolean;
  emailReminders: boolean;
}

export async function getUserNotificationPrefs(
  userId: string
): Promise<UserNotificationPref> {
  const pool = getPool();
  if (!pool) return { userId, reminders: true, emailReminders: false };

  try {
    const res = await pool.query(
      `SELECT reminders, email_reminders FROM public.notification_prefs WHERE user_id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      return { userId, reminders: true, emailReminders: false };
    }

    return {
      userId,
      reminders: Boolean(res.rows[0].reminders),
      emailReminders: Boolean(res.rows[0].email_reminders),
    };
  } catch (err) {
    logger.error(
      "reminders.get_prefs_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return { userId, reminders: true, emailReminders: false };
  }
}

export async function updateUserNotificationPrefs(
  userId: string,
  prefs: { reminders?: boolean; emailReminders?: boolean }
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  try {
    await pool.query(
      `INSERT INTO public.notification_prefs (user_id, reminders, email_reminders, updated_at)
       VALUES ($1, COALESCE($2, true), COALESCE($3, false), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         reminders = COALESCE($2, public.notification_prefs.reminders),
         email_reminders = COALESCE($3, public.notification_prefs.email_reminders),
         updated_at = NOW()`,
      [userId, prefs.reminders ?? null, prefs.emailReminders ?? null]
    );
    return true;
  } catch (err) {
    logger.error(
      "reminders.update_prefs_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return false;
  }
}

/**
 * Sweeps completed orders with roast_date_at_ship and sends smart reminders:
 * 1. 'peak_window' (around 14-20 days): "Seduh minggu ini saat rasa sedang optimal"
 * 2. 'reorder' (around 21-35 days): "Stok kopi mungkin habis, beli lagi?"
 *
 * Guarantees idempotency via unique constraint on reminder_log (order_id, kind).
 */
export async function sweepSmartReminders(
  now: Date = new Date()
): Promise<{ processed: number; peakSent: number; reorderSent: number }> {
  const pool = getPool();
  if (!pool) return { processed: 0, peakSent: 0, reorderSent: 0 };

  let peakSent = 0;
  let reorderSent = 0;

  try {
    const ordersRes = await pool.query(
      `SELECT o.id, o.order_number, o.buyer_id, o.roast_date_at_ship::text,
              COALESCE(np.reminders, true) AS allow_reminders
       FROM public.orders o
       LEFT JOIN public.notification_prefs np ON o.buyer_id = np.user_id
       WHERE o.status = 'completed'
         AND o.roast_date_at_ship IS NOT NULL
         AND o.buyer_id IS NOT NULL
         AND (np.reminders IS NULL OR np.reminders = true)`
    );

    for (const row of ordersRes.rows) {
      const roastDate = new Date(row.roast_date_at_ship);
      if (isNaN(roastDate.getTime())) continue;

      const diffDays = Math.floor(
        (now.getTime() - roastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check Peak Window reminder (days 14 - 20)
      if (diffDays >= 14 && diffDays <= 20) {
        const logRes = await pool.query(
          `INSERT INTO public.reminder_log (order_id, kind)
           VALUES ($1, 'peak_window')
           ON CONFLICT (order_id, kind) DO NOTHING
           RETURNING id`,
          [row.id]
        );

        if (logRes.rows.length > 0) {
          await createNotification({
            userId: asUserId(row.buyer_id),
            title: "Waktu Terbaik Menyeduh! ☕",
            message: `Kopi pada pesanan ${row.order_number} sedang berada di puncak rasa optimal (hari ke-${diffDays}). Seduh minggu ini untuk cita rasa terbaik!`,
            type: "reminder",
            link: `/orders/${row.id}`,
          });
          peakSent++;
        }
      }

      // Check Reorder reminder (days 21 - 35)
      if (diffDays >= 21 && diffDays <= 35) {
        const logRes = await pool.query(
          `INSERT INTO public.reminder_log (order_id, kind)
           VALUES ($1, 'reorder')
           ON CONFLICT (order_id, kind) DO NOTHING
           RETURNING id`,
          [row.id]
        );

        if (logRes.rows.length > 0) {
          await createNotification({
            userId: asUserId(row.buyer_id),
            title: "Stok Kopi Menipis? 📦",
            message: `Pesanan ${row.order_number} sudah berjalan ${diffDays} hari sejak disangrai. Stok kopi mungkin hampir habis, yuk jelajahi varian baru!`,
            type: "reminder",
            link: "/catalog",
          });
          reorderSent++;
        }
      }
    }

    return {
      processed: ordersRes.rows.length,
      peakSent,
      reorderSent,
    };
  } catch (err) {
    logger.error(
      "reminders.sweep_failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return { processed: 0, peakSent: 0, reorderSent: 0 };
  }
}
