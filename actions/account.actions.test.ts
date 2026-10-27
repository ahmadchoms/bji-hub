import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

let mockSession = {
  role: "buyer",
  userId: "user-buyer-1",
  email: "buyer@test.com",
};

let mockOrdersList: any[] = [];

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(async () => mockSession),
  MOCK_SESSION_COOKIE: "mock_session",
}));

vi.mock("@/lib/data/orders", () => ({
  getOrdersByBuyer: vi.fn(async () => mockOrdersList),
}));

vi.mock("@/lib/data/audit-logs", () => ({
  recordAuditLog: vi.fn(async () => ({ id: "audit-1" })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    delete: vi.fn(),
  })),
}));

import {
  deleteAccountAction,
  changePasswordFromProfileAction,
  signOutAllDevicesAction,
} from "./account.actions";

describe("deleteAccountAction (F6)", () => {
  beforeEach(() => {
    mockSession = {
      role: "buyer",
      userId: "user-buyer-1",
      email: "buyer@test.com",
    };
    mockOrdersList = [];
  });

  it("fails if user is guest", async () => {
    mockSession = { role: "guest", userId: "", email: "" };
    const res = await deleteAccountAction("HAPUS AKUN");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("Sesi tidak valid");
    }
  });

  it("fails if confirmation phrase is incorrect", async () => {
    const res = await deleteAccountAction("salah");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("HAPUS AKUN");
    }
  });

  it("blocks deletion if user has in-progress orders", async () => {
    mockOrdersList = [
      { id: "ord-1", status: "paid" },
      { id: "ord-2", status: "delivered" },
    ];
    const res = await deleteAccountAction("HAPUS AKUN");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("pesanan yang sedang berjalan");
    }
  });

  it("allows deletion if user only has completed or cancelled orders", async () => {
    mockOrdersList = [
      { id: "ord-1", status: "delivered" },
      { id: "ord-2", status: "cancelled" },
    ];
    const res = await deleteAccountAction("HAPUS AKUN");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.redirectTo).toBe("/login?deleted=1");
    }
  });

  it("succeeds when user has no orders and confirmation matches", async () => {
    mockOrdersList = [];
    const res = await deleteAccountAction("hapus akun");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.redirectTo).toBe("/login?deleted=1");
    }
  });
});

describe("changePasswordFromProfileAction & signOutAllDevicesAction (S8)", () => {
  beforeEach(() => {
    mockSession = {
      role: "buyer",
      userId: "user-buyer-1",
      email: "buyer@test.com",
    };
  });

  it("fails if password does not meet security criteria", async () => {
    const res = await changePasswordFromProfileAction({
      oldPassword: "oldPassword123!",
      newPassword: "short",
    });
    expect(res.success).toBe(false);
  });

  it("succeeds with strong password in mock environment", async () => {
    const res = await changePasswordFromProfileAction({
      oldPassword: "OldPassword123!",
      newPassword: "NewStrongPassword2026#",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.message).toContain("seluruh perangkat lain telah dikeluarkan");
    }
  });

  it("signs out from all devices and redirects to login", async () => {
    const res = await signOutAllDevicesAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.redirectTo).toBe("/login?message=logged_out_all");
    }
  });
});
