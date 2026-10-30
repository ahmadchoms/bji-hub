import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db/pool";

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const mockNotifications: NotificationRecord[] = [];

export async function getUserNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationRecord[]> {
  if (!userId) return [];
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id as "userId", title, message, type, link,
                is_read as "isRead", created_at as "createdAt"
         FROM public.notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit],
      );
      return res.rows.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt).toISOString(),
      }));
    } catch (err) {
      logger.error("notifications.get_failed", err, { userId });
      if (process.env.DATA_SOURCE !== "mock") {
        throw err;
      }
    }
  }

  return mockNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function notifySeller(
  sellerProfileId: string,
  payload: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  },
): Promise<NotificationRecord | null> {
  let userId: string | undefined;

  if (process.env.DATA_SOURCE === "mock") {
    const { mockSellers } = await import("@/lib/mock/data");
    const seller = mockSellers.find((s) => s.id === sellerProfileId);
    userId = seller?.userId;
  } else {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT user_id as "userId" FROM public.seller_profiles WHERE id = $1 LIMIT 1`,
          [sellerProfileId],
        );
        userId = res.rows[0]?.userId;
      } catch (err) {
        logger.error("notification.resolve_seller_user_failed", err, { sellerProfileId });
      }
    }
    if (!userId) {
      const { getSellerById } = await import("@/lib/data");
      const seller = await getSellerById(sellerProfileId);
      userId = seller?.userId;
    }
  }

  if (!userId) {
    logger.warn("notification.seller_user_not_found", { sellerProfileId });
    return null;
  }
  return createNotification({ ...payload, userId });
}

export async function notifyAdmins(payload: {
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<NotificationRecord[]> {
  const adminIds: string[] = [];

  if (process.env.DATA_SOURCE === "mock") {
    adminIds.push("user-admin-1");
  } else {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query<{ id: string }>(
          `SELECT id FROM public.users WHERE role = 'ADMIN'`,
        );
        adminIds.push(...res.rows.map((r) => r.id));
      } catch (err) {
        logger.error("notifications.find_admins_failed", err);
      }
    }
  }

  if (adminIds.length === 0) {
    adminIds.push("user-admin-1");
  }

  const results: NotificationRecord[] = [];
  for (const adminId of adminIds) {
    const notif = await createNotification({
      ...payload,
      userId: adminId,
    });
    results.push(notif);
  }
  return results;
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<NotificationRecord> {
  const pool = getPool();
  const id = `notif-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const type = data.type || "system";
  const link = data.link ?? null;

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO public.notifications (id, user_id, title, message, type, link, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7)
         RETURNING id, user_id as "userId", title, message, type, link, is_read as "isRead", created_at as "createdAt"`,
        [id, data.userId, data.title, data.message, type, link, now],
      );
      return {
        ...res.rows[0],
        createdAt: new Date(res.rows[0].createdAt).toISOString(),
      };
    } catch (err) {
      logger.error("notifications.create_failed", err, { userId: data.userId });
    }
  }

  const record: NotificationRecord = {
    id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type,
    link,
    isRead: false,
    createdAt: now,
  };
  mockNotifications.unshift(record);
  return record;
}

export async function markNotificationAsRead(
  id: string,
  userId: string,
): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("notifications.mark_read_failed", err, { id, userId });
      return false;
    }
  }

  const item = mockNotifications.find((n) => n.id === id && n.userId === userId);
  if (item) {
    item.isRead = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE public.notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
        [userId],
      );
      return res.rowCount ?? 0;
    } catch (err) {
      logger.error("notifications.mark_all_read_failed", err, { userId });
      return 0;
    }
  }

  let count = 0;
  for (const n of mockNotifications) {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      count++;
    }
  }
  return count;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!userId) return 0;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT COUNT(*)::int as count FROM public.notifications WHERE user_id = $1 AND is_read = false`,
        [userId],
      );
      return res.rows[0]?.count ?? 0;
    } catch (err) {
      logger.error("notifications.count_unread_failed", err, { userId });
      return 0;
    }
  }

  return mockNotifications.filter((n) => n.userId === userId && !n.isRead).length;
}

export function _resetMockNotificationsForTest() {
  mockNotifications.length = 0;
}
