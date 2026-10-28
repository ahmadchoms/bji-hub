"use server";

import { requireRole } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  autoCancelExpiredPendingOrders,
  autoCompleteExpiredShippedOrders,
} from "@/lib/data/orders";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { logger } from "@/lib/logger";

export interface MaintenanceRunResult {
  canceledOrdersCount: number;
  completedOrdersCount: number;
  timestamp: string;
}

export async function runManualMaintenanceAction(): Promise<
  ActionResult<MaintenanceRunResult>
> {
  const session = await requireRole(["admin"], "/admin/maintenance");

  try {
    const [cancelRes, completeRes] = await Promise.all([
      autoCancelExpiredPendingOrders(1.25),
      autoCompleteExpiredShippedOrders(2),
    ]);

    const result: MaintenanceRunResult = {
      canceledOrdersCount: cancelRes.canceledCount,
      completedOrdersCount: completeRes.completedCount,
      timestamp: new Date().toISOString(),
    };

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
