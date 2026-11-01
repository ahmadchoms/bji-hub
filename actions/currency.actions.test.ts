process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrencyRatesAction,
  updateCurrencyRateAction,
} from "./currency.actions";
import * as sessionModule from "@/lib/auth/session";
import * as adminGuardModule from "@/lib/auth/admin-guard";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("actions/currency.actions.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects non-admin users from accessing currency rates", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "user-1",
      role: "buyer",
    } as any);
    vi.spyOn(adminGuardModule, "isAdminAllowed").mockResolvedValue(false);

    const res = await getCurrencyRatesAction();
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Akses admin ditolak");
    }
  });

  it("returns currency rates for authenticated admin", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "admin-1",
      role: "admin",
    } as any);
    vi.spyOn(adminGuardModule, "isAdminAllowed").mockResolvedValue(true);

    const res = await getCurrencyRatesAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(Array.isArray(res.data.rates)).toBe(true);
      const usd = res.data.rates.find((r) => r.code === "USD");
      expect(usd).toBeDefined();
    }
  });

  it("validates input on update and updates currency rate", async () => {
    vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      userId: "admin-1",
      role: "admin",
    } as any);
    vi.spyOn(adminGuardModule, "isAdminAllowed").mockResolvedValue(true);

    // Invalid code
    const invCode = await updateCurrencyRateAction("X", 0.5);
    expect(invCode.success).toBe(false);

    // Invalid rate
    const invRate = await updateCurrencyRateAction("USD", -1);
    expect(invRate.success).toBe(false);

    // Valid update
    const valid = await updateCurrencyRateAction("USD", 0.00007);
    expect(valid.success).toBe(true);
  });
});
