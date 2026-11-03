import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSchemaStatus } from "./schema-check";

describe("lib/db/schema-check (K1)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ok: true in mock mode (no DB pool)", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const status = await getSchemaStatus();
    expect(status.ok).toBe(true);
    expect(status.mode).toBe("mock");
    expect(status.missing).toEqual([]);
  });

  it("returns ok: true when all migrations are applied in database", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    const poolModule = await import("@/lib/db/pool");
    const fs = await import("node:fs");
    const path = await import("node:path");

    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    const expected = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const mockPool = {
      query: vi.fn().mockResolvedValue({
        rows: expected.map((name) => ({ migration_name: name })),
      }),
    };

    const spy = vi.spyOn(poolModule, "getPool").mockReturnValue(mockPool as unknown as ReturnType<typeof poolModule.getPool>);

    const status = await getSchemaStatus();
    expect(status.ok).toBe(true);
    expect(status.mode).toBe("db");
    expect(status.missing).toEqual([]);
    expect(status.applied).toBe(expected.length);

    spy.mockRestore();
  });

  it("identifies missing unapplied migrations and returns ok: false", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    const poolModule = await import("@/lib/db/pool");

    // Mock only 1 applied migration
    const mockPool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ migration_name: "20261028_init" }],
      }),
    };

    const spy = vi.spyOn(poolModule, "getPool").mockReturnValue(mockPool as unknown as ReturnType<typeof poolModule.getPool>);

    const status = await getSchemaStatus();
    expect(status.ok).toBe(false);
    expect(status.mode).toBe("db");
    expect(status.missing.length).toBeGreaterThan(0);
    expect(status.missing).not.toContain("20261028_init");

    spy.mockRestore();
  });

  it("returns ok: false and lists all migrations when _prisma_migrations table does not exist", async () => {
    vi.stubEnv("DATA_SOURCE", "prisma");
    const poolModule = await import("@/lib/db/pool");

    const mockPool = {
      query: vi.fn().mockRejectedValue(new Error('relation "_prisma_migrations" does not exist')),
    };

    const spy = vi.spyOn(poolModule, "getPool").mockReturnValue(mockPool as unknown as ReturnType<typeof poolModule.getPool>);

    const status = await getSchemaStatus();
    expect(status.ok).toBe(false);
    expect(status.applied).toBe(0);
    expect(status.missing.length).toBeGreaterThan(0);

    spy.mockRestore();
  });
});
