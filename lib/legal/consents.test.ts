import { describe, it, expect, beforeEach, vi } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  recordUserConsent,
  hasUserAcceptedLatest,
  getUserConsents,
  mockUserConsents,
} from "@/lib/data/consents";
import { CURRENT_VERSIONS } from "./versions";

describe("lib/legal/consents (F1)", () => {
  beforeEach(() => {
    mockUserConsents.length = 0;
  });

  it("records user consent and confirms latest acceptance", async () => {
    const isAcceptedBefore = await hasUserAcceptedLatest("user-1", "terms");
    expect(isAcceptedBefore).toBe(false);

    const record = await recordUserConsent({
      userId: "user-1",
      document: "terms",
      ipHash: "hash-ip-123",
    });

    expect(record.userId).toBe("user-1");
    expect(record.document).toBe("terms");
    expect(record.version).toBe(CURRENT_VERSIONS.terms);
    expect(record.ipHash).toBe("hash-ip-123");

    const isAcceptedAfter = await hasUserAcceptedLatest("user-1", "terms");
    expect(isAcceptedAfter).toBe(true);

    // Other documents remain unaccepted
    const privacyAccepted = await hasUserAcceptedLatest("user-1", "privacy");
    expect(privacyAccepted).toBe(false);
  });

  it("updates existing consent on duplicate acceptance", async () => {
    await recordUserConsent({
      userId: "user-1",
      document: "privacy",
      ipHash: "hash-1",
    });
    expect(mockUserConsents.length).toBe(1);

    await recordUserConsent({
      userId: "user-1",
      document: "privacy",
      ipHash: "hash-2",
    });
    expect(mockUserConsents.length).toBe(1);
    expect(mockUserConsents[0].ipHash).toBe("hash-2");
  });

  it("detects when accepted version is outdated", async () => {
    // Record old version
    await recordUserConsent({
      userId: "user-1",
      document: "terms",
      version: "2025-01-v0",
    });

    const isLatest = await hasUserAcceptedLatest("user-1", "terms");
    expect(isLatest).toBe(false);
  });

  it("throws error on database 42P01 failure and does not return fake acceptance (K1)", async () => {
    const poolModule = await import("@/lib/db/pool");
    const mockPool = {
      query: vi.fn().mockRejectedValue(new Error('relation "public.user_consents" does not exist (code: 42P01)')),
    };
    const spy = vi.spyOn(poolModule, "getPool").mockReturnValue(mockPool as unknown as ReturnType<typeof poolModule.getPool>);

    await expect(hasUserAcceptedLatest("user-1", "terms")).rejects.toThrow(/does not exist/);
    await expect(
      recordUserConsent({
        userId: "user-1",
        document: "terms",
      }),
    ).rejects.toThrow(/does not exist/);

    spy.mockRestore();
  });

  it("throws error in production when COOKIE_SECRET is missing (K2)", async () => {
    const { hashIp } = await import("@/lib/data/consents");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATA_SOURCE", "prisma");
    vi.stubEnv("COOKIE_SECRET", "");

    expect(() => hashIp("192.168.1.1")).toThrow(/COOKIE_SECRET wajib diisi/);
    vi.unstubAllEnvs();
  });
});
