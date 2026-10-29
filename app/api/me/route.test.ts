import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/me (PERF-1)", () => {
  it("returns unauthenticated guest payload with private, no-store headers when no session exists", async () => {
    const sessionModule = await import("@/lib/auth/session");
    const spy = vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      role: "guest",
      userId: null,
      email: null,
      sellerId: null,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("private, no-store");

    const json = await res.json();
    expect(json).toEqual({
      authenticated: false,
      role: "guest",
      user: null,
      storeName: null,
      activeOrdersCount: 0,
      unreadCount: 0,
    });

    spy.mockRestore();
  });

  it("returns authenticated user details when valid session is provided", async () => {
    const sessionModule = await import("@/lib/auth/session");
    const spySession = vi.spyOn(sessionModule, "getSession").mockResolvedValue({
      role: "seller",
      userId: "user-123",
      email: "budi@roastery.com",
      sellerId: "seller-456",
    });

    const dataModule = await import("@/lib/data");
    const spySeller = vi.spyOn(dataModule, "getSellerById").mockResolvedValue({
      id: "seller-456",
      userId: "user-123",
      businessName: "Kopi Budi Jaya",
      slug: "kopi-budi-jaya",
      bio: "Roastery",
      city: "Bandung",
      province: "Jawa Barat",
      address: "Jl. Riau No. 1",
      whatsappNumber: "08123456789",
      isVerified: true,
      tier: "growth",
      createdAt: new Date().toISOString(),
      user: {
        id: "user-123",
        email: "budi@roastery.com",
        role: "SELLER" as const,
        createdAt: new Date().toISOString(),
      },
      listings: [],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.authenticated).toBe(true);
    expect(json.role).toBe("seller");
    expect(json.storeName).toBe("Kopi Budi Jaya");
    expect(json.user?.firstName).toBe("budi");

    spySession.mockRestore();
    spySeller.mockRestore();
  });
});
