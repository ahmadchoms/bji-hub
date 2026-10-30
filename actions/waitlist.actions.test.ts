import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  joinWaitlistAction,
  leaveWaitlistAction,
  checkWaitlistStatusAction,
} from "./waitlist.actions";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";

describe("Waitlist Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects guest users with a helpful message", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "guest",
      sellerId: null,
      userId: null,
    });

    const res = await joinWaitlistAction("list-out-of-stock");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("masuk akun");
    }
  });

  it("allows authenticated buyer to join waitlist and check status", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "buyer-waitlist-1",
      email: "buyer@example.com",
    });

    const joinRes = await joinWaitlistAction("list-out-of-stock");
    expect(joinRes.success).toBe(true);

    const statusRes = await checkWaitlistStatusAction("list-out-of-stock");
    expect(statusRes.success).toBe(true);
    if (statusRes.success) {
      expect(statusRes.data.inWaitlist).toBe(true);
    }

    const leaveRes = await leaveWaitlistAction("list-out-of-stock");
    expect(leaveRes.success).toBe(true);

    const afterLeave = await checkWaitlistStatusAction("list-out-of-stock");
    if (afterLeave.success) {
      expect(afterLeave.data.inWaitlist).toBe(false);
    }
  });

  it("enforces max 20 active waitlist entries limit", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "buyer-heavy-collector",
      email: "heavy@example.com",
    });

    // Join 20 items
    for (let i = 1; i <= 20; i++) {
      const res = await joinWaitlistAction(`item-${i}`);
      expect(res.success).toBe(true);
    }

    // 21st attempt should be rejected
    const attempt21 = await joinWaitlistAction("item-21");
    expect(attempt21.success).toBe(false);
    if (!attempt21.success) {
      expect(attempt21.error).toContain("maksimal 20");
    }
  });
});
