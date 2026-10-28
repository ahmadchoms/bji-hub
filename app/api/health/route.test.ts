import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health (B8)", () => {
  it("returns 200 with status ok and no-store headers", async () => {
    const originalDataSource = process.env.DATA_SOURCE;
    process.env.DATA_SOURCE = "mock";

    const res = await GET(new Request("http://localhost/api/health"));
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

    const res = await GET(new Request("http://localhost/api/health"));
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

  describe("GET /api/health?deep=1 (M13 Observability)", () => {
    it("returns 401 in production when authorization token is missing or invalid", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CRON_SECRET", "supersecret");

      const req = new Request("http://localhost:3000/api/health?deep=1");
      const res = await GET(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json).toEqual({ error: "Unauthorized" });

      vi.unstubAllEnvs();
    });

    it("returns 200 with diagnostics when authorized and subsystems healthy", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CRON_SECRET", "supersecret");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
      vi.stubEnv("MIDTRANS_SERVER_KEY", "midtrans-key");
      vi.stubEnv("DATA_SOURCE", "mock");

      const req = new Request("http://localhost:3000/api/health?deep=1", {
        headers: { Authorization: "Bearer supersecret" },
      });
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.deep).toBe(true);
      expect(json.checks.database).toBe("ok");
      expect(json.checks.storage).toBe("ok");
      expect(json.checks.payment.status).toBe("ok");

      vi.unstubAllEnvs();
    });

    it("returns 503 when a subsystem is missing required configuration", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("CRON_SECRET", "supersecret");
      vi.stubEnv("MIDTRANS_SERVER_KEY", "");

      const req = new Request("http://localhost:3000/api/health?deep=1&token=supersecret");
      const res = await GET(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.status).toBe("unhealthy");
      expect(json.checks.payment.status).toBe("missing_server_key");

      vi.unstubAllEnvs();
    });
  });
});
