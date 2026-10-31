process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProducerAction,
  verifyProducerClaimsAction,
  getVerifiedProducersAction,
  requestProducerAttributionAction,
  approveProducerAttributionAction,
  rejectProducerAttributionAction,
  getProducerAttributionsAction,
} from "./producer.actions";

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn().mockResolvedValue({
    userId: "admin-1",
    role: "admin",
  }),
  requireSeller: vi.fn().mockResolvedValue({
    userId: "seller-1",
    sellerId: "seller-1",
    role: "seller",
  }),
}));

vi.mock("@/lib/client-ip", () => ({
  getClientIp: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/data/audit-logs", () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Producer Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin to create a new producer", async () => {
    const res = await createProducerAction({
      name: "Kelompok Tani Gunung Tilu",
      kind: "petani",
      province: "Jawa Barat",
      village: "Pangalengan",
      altitudeMin: 1400,
      altitudeMax: 1700,
      farmersCount: 45,
      story: "Komunitas petani kopi lereng Gunung Tilu.",
      certifications: ["indikasi-geografis"],
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.name).toBe("Kelompok Tani Gunung Tilu");
      expect(res.data.kind).toBe("petani");
      expect(res.data.certifications).toContain("indikasi-geografis");
      expect(res.data.claimsVerifiedAt).toBeNull();
    }
  });

  it("allows admin to verify producer claims and sets claimsVerifiedAt", async () => {
    const createRes = await createProducerAction({
      name: "Koperasi Tani Sindangkerta",
      kind: "koperasi",
      certifications: ["organik-indonesia"],
    });
    expect(createRes.success).toBe(true);
    if (!createRes.success) return;

    const verifyRes = await verifyProducerClaimsAction(createRes.data.id);
    expect(verifyRes.success).toBe(true);
    if (verifyRes.success) {
      expect(verifyRes.data.claimsVerifiedAt).not.toBeNull();
    }
  });

  it("fetches verified producers", async () => {
    const res = await getVerifiedProducersAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(Array.isArray(res.data)).toBe(true);
    }
  });

  it("handles producer attribution lifecycle: request, list, approve, reject", async () => {
    // 1. Seller requests attribution
    const reqRes = await requestProducerAttributionAction("prod-gayo-kbqb", "https://example.com/invoice.pdf");
    expect(reqRes.success).toBe(true);

    // 2. Admin retrieves attributions
    const listRes = await getProducerAttributionsAction({ producerId: "prod-gayo-kbqb" });
    expect(listRes.success).toBe(true);
    if (listRes.success) {
      expect(listRes.data.length).toBeGreaterThan(0);
    }

    // 3. Admin approves attribution
    const approveRes = await approveProducerAttributionAction("prod-gayo-kbqb", "seller-1");
    expect(approveRes.success).toBe(true);

    // 4. Admin rejects attribution
    const rejectRes = await rejectProducerAttributionAction("prod-gayo-kbqb", "seller-1");
    expect(rejectRes.success).toBe(true);
  });
});
