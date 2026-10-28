import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

let mockSession = {
  role: "admin",
  userId: "admin-1",
  email: "admin@test.com",
};

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(async () => mockSession),
}));

vi.mock("@/lib/data/audit-logs", () => ({
  recordAuditLog: vi.fn(async () => ({ id: "audit-1" })),
}));

import { runManualMaintenanceAction } from "./maintenance.actions";

describe("runManualMaintenanceAction (2.2-C)", () => {
  beforeEach(() => {
    mockSession = {
      role: "admin",
      userId: "admin-1",
      email: "admin@test.com",
    };
  });

  it("runs manual maintenance and returns canceled and completed order counts", async () => {
    const res = await runManualMaintenanceAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(typeof res.data.canceledOrdersCount).toBe("number");
      expect(typeof res.data.completedOrdersCount).toBe("number");
      expect(res.data.timestamp).toBeDefined();
    }
  });
});
