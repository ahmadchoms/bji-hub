import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health (B8)", () => {
  it("returns 200 with status ok and no-store headers", async () => {
    const originalDataSource = process.env.DATA_SOURCE;
    process.env.DATA_SOURCE = "mock";

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");

    const json = await res.json();
    expect(json).toEqual({ status: "ok" });

    process.env.DATA_SOURCE = originalDataSource;
  });

  it("returns 503 with status unhealthy and no leaked details when database fails", async () => {
    const originalDataSource = process.env.DATA_SOURCE;
    process.env.DATA_SOURCE = "prisma";

    const prismaModule = await import("@/lib/data/prisma/client");
    const spy = vi.spyOn(prismaModule, "getPrisma").mockReturnValue({
      $queryRaw: vi.fn().mockRejectedValue(new Error("Connection refused at secret-db-host:5432")),
    } as unknown as ReturnType<typeof prismaModule.getPrisma>);

    const res = await GET();
    expect(res.status).toBe(503);
    expect(res.headers.get("Cache-Control")).toContain("no-store");

    const json = await res.json();
    expect(json).toEqual({ status: "unhealthy" });
    // Must NOT leak database credentials or error trace
    expect(JSON.stringify(json)).not.toContain("Connection refused");
    expect(JSON.stringify(json)).not.toContain("secret-db-host");

    spy.mockRestore();
    process.env.DATA_SOURCE = originalDataSource;
  });
});
