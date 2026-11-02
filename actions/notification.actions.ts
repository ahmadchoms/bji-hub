"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationRecord,
} from "@/lib/data/notifications";
import {
  updateUserNotificationPrefs,
} from "@/lib/coffee/reminders";

const updatePrefsSchema = z.object({
  reminders: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
});

export async function updateUserNotificationPrefsAction(
  input: z.infer<typeof updatePrefsSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Sesi tidak valid atau Anda belum masuk");
  }
  const parsed = updatePrefsSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Data preferensi tidak valid");
  }
  const success = await updateUserNotificationPrefs(session.userId, parsed.data);
  return ok({ success });
}

export async function getNotificationsAction(
  limit = 20,
): Promise<ActionResult<NotificationRecord[]>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return ok([]);
  }
  const notifs = await getUserNotifications(session.userId, limit);
  return ok(notifs);
}

export async function markNotificationAsReadAction(
  notificationId: string,
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Sesi tidak valid");
  }
  const success = await markNotificationAsRead(notificationId, session.userId);
  return ok({ success });
}

export async function markAllNotificationsAsReadAction(): Promise<
  ActionResult<{ count: number }>
> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Sesi tidak valid");
  }
  const count = await markAllNotificationsAsRead(session.userId);
  return ok({ count });
}
