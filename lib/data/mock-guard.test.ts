import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertMockAllowed, isMockAllowed } from "@/lib/data/mock-guard";
import { getProducers } from "@/lib/data/producers";
import { getCoffeeOrigins } from "@/lib/data/origins";

describe("Fallback Policy Guard (Audit #8 Rule 7)", () => {
  const originalDataSource = process.env.DATA_SOURCE;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("permits mock fallback when DATA_SOURCE === 'mock'", () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(isMockAllowed()).toBe(true);
    expect(() => assertMockAllowed("unit-test")).not.toThrow();
  });

  it("throws when DATA_SOURCE === 'prisma' (production/staging DB failure)", () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    expect(isMockAllowed()).toBe(false);
    expect(() => assertMockAllowed("unit-test")).toThrow(
      /mock fallback is disabled/
    );
  });

  it("getProducers throws in production when DB query fails and does not return mock fixtures", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    const poolModule = await import("@/lib/db/pool");
    vi.spyOn(poolModule, "getPool").mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("DB connection failure")),
    } as unknown as ReturnType<typeof poolModule.getPool>);
    await expect(getProducers()).rejects.toThrow(/mock fallback is disabled/);
  });

  it("getCoffeeOrigins throws in production when DB query fails and does not return mock fixtures", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    const poolModule = await import("@/lib/db/pool");
    vi.spyOn(poolModule, "getPool").mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("DB connection failure")),
    } as unknown as ReturnType<typeof poolModule.getPool>);
    await expect(getCoffeeOrigins()).rejects.toThrow(/mock fallback is disabled/);
  });
});
