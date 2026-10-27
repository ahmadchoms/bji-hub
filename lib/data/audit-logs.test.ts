import { describe, expect, it, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  recordAuditLog,
  getAuditLogs,
  _resetMockAuditLogsForTest,
} from "./audit-logs";

describe("Audit Logs Data Layer (F2)", () => {
  beforeEach(() => {
    _resetMockAuditLogsForTest();
  });

  it("records and retrieves audit logs with JSON details and actor metadata", async () => {
    const entry = await recordAuditLog({
      actorId: "admin-user-1",
      actorRole: "admin",
      action: "approve_payout",
      targetId: "payout-999",
      targetType: "payout",
      details: { amount: 500000, bankName: "BCA" },
      ipAddress: "192.168.1.1",
    });

    expect(entry.id).toBeDefined();
    expect(entry.actorId).toBe("admin-user-1");
    expect(entry.action).toBe("approve_payout");
    expect(entry.targetId).toBe("payout-999");
    expect(entry.details).toContain("500000");

    const logs = await getAuditLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(entry.id);
    expect(logs[0].action).toBe("approve_payout");
  });

  it("filters audit logs by action type", async () => {
    await recordAuditLog({
      actorId: "admin-1",
      actorRole: "admin",
      action: "verify_seller",
      targetId: "seller-1",
    });

    await recordAuditLog({
      actorId: "admin-1",
      actorRole: "admin",
      action: "suspend_listing",
      targetId: "listing-2",
    });

    const verifyLogs = await getAuditLogs({ action: "verify_seller" });
    expect(verifyLogs.length).toBe(1);
    expect(verifyLogs[0].targetId).toBe("seller-1");

    const suspendLogs = await getAuditLogs({ action: "suspend_listing" });
    expect(suspendLogs.length).toBe(1);
    expect(suspendLogs[0].targetId).toBe("listing-2");
  });
});
