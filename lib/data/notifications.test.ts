import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  createNotification,
  notifySeller,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  _resetMockNotificationsForTest,
} from "./notifications";

describe("notifications data module (F1)", () => {
  beforeEach(() => {
    _resetMockNotificationsForTest();
  });

  it("creates and retrieves notifications for a user", async () => {
    await createNotification({
      userId: "user-1",
      title: "Pesanan Dibayar",
      message: "Pesanan ORD-123 telah dibayar pembeli.",
      type: "order_status",
      link: "/dashboard/orders",
    });

    const notifs = await getUserNotifications("user-1");
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toBe("Pesanan Dibayar");
    expect(notifs[0].isRead).toBe(false);

    const count = await getUnreadNotificationCount("user-1");
    expect(count).toBe(1);
  });

  it("marks a notification as read", async () => {
    const notif = await createNotification({
      userId: "user-1",
      title: "Resi Diperbarui",
      message: "Paket sedang dikirim oleh kurir.",
    });

    const marked = await markNotificationAsRead(notif.id, "user-1");
    expect(marked).toBe(true);

    const count = await getUnreadNotificationCount("user-1");
    expect(count).toBe(0);
  });

  it("marks all notifications as read in batch", async () => {
    await createNotification({ userId: "user-2", title: "N1", message: "M1" });
    await createNotification({ userId: "user-2", title: "N2", message: "M2" });

    const initialCount = await getUnreadNotificationCount("user-2");
    expect(initialCount).toBe(2);

    const readCount = await markAllNotificationsAsRead("user-2");
    expect(readCount).toBe(2);

    const finalCount = await getUnreadNotificationCount("user-2");
    expect(finalCount).toBe(0);
  });

  it("resolves seller.userId correctly when using notifySeller (M5)", async () => {
    const res = await notifySeller("seller-1", {
      title: "Pesanan Baru Masuk",
      message: "Ada pesanan baru ORD-SELLER-1.",
      type: "order_status",
      link: "/dashboard/orders",
    });

    expect(res).not.toBeNull();
    expect(res?.userId).toBe("user-seller-1");

    const sellerNotifs = await getUserNotifications("user-seller-1");
    expect(sellerNotifs.some((n) => n.title === "Pesanan Baru Masuk")).toBe(true);
  });
});
