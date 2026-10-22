import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("@/lib/data/prisma/client", () => ({
  getPrisma: () => prismaMock,
}));

const supabaseMock = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabaseMock,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

import { getSession } from "./session";

describe("getSession role safety and database interaction", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key");
    vi.clearAllMocks();
  });

  it("creates user with BUYER role when user is not found in db and never calls upsert", async () => {
    supabaseMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "u-test-new",
          email: "attacker@admin.com",
          user_metadata: { role: "admin" }, // Attempts to forge role
        },
      },
    });

    // First findUnique returns null, second findUnique returns created BUYER
    prismaMock.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "u-test-new",
        email: "attacker@admin.com",
        role: "BUYER",
        sellerProfile: null,
      });

    prismaMock.user.create.mockResolvedValueOnce({
      id: "u-test-new",
      email: "attacker@admin.com",
      role: "BUYER",
    });

    const session = await getSession();

    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        id: "u-test-new",
        email: "attacker@admin.com",
        role: "BUYER",
      },
    });
    expect(session.role).toBe("buyer");
  });
});
