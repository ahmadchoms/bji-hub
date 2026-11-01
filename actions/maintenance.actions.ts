"use server";

import { requireRole } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  autoCancelExpiredPendingOrders,
  autoCompleteExpiredShippedOrders,
} from "@/lib/data/orders";
import { sweepSmartReminders } from "@/lib/coffee/reminders";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { logger } from "@/lib/logger";

export interface MaintenanceRunResult {
  canceledOrdersCount: number;
  completedOrdersCount: number;
  remindersSentCount?: number;
  timestamp: string;
}

export async function runManualMaintenanceAction(): Promise<
  ActionResult<MaintenanceRunResult>
> {
  const session = await requireRole(["admin"], "/admin/maintenance");

  try {
    const [cancelRes, completeRes, reminderRes] = await Promise.all([
      autoCancelExpiredPendingOrders(1.25),
      autoCompleteExpiredShippedOrders(2),
      // ignore: non-blocking reminder sweep failure
      sweepSmartReminders().catch(() => ({ processed: 0, peakSent: 0, reorderSent: 0 })),
    ]);

    const result: MaintenanceRunResult = {
      canceledOrdersCount: cancelRes.canceledCount,
      completedOrdersCount: completeRes.completedCount,
      remindersSentCount: reminderRes.peakSent + reminderRes.reorderSent,
      timestamp: new Date().toISOString(),
    };

    if (cancelRes.canceledCount > 0) {
      try {
        const { revalidateListing } = await import("@/lib/cache/revalidate");
        revalidateListing(null);
      } catch {
        // ignore
      }
    }

    await recordAuditLog({
      actorId: session.userId || "admin",
      actorRole: session.role,
      action: "manual_maintenance",
      targetId: "system",
      targetType: "maintenance",
      details: `Admin memicu pemeliharaan manual: ${result.canceledOrdersCount} pesanan dibatalkan (kedaluwarsa), ${result.completedOrdersCount} pesanan diselesaikan (>48 jam).`,
    });

    return ok(result);
  } catch (err) {
    logger.error("admin.maintenance_failed", err);
    return fail("Gagal menjalankan pemeliharaan sistem");
  }
}
