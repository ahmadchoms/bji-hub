import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

describe("POST /api/csp-report (E5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts valid CSP report and returns 204", async () => {
    const warnSpy = vi.spyOn(logger, "warn");
    const payload = JSON.stringify({
      "csp-report": {
        "document-uri": "https://bji-hub.com/catalog",
        "violated-directive": "script-src 'self'",
        "blocked-uri": "http://evil.com/xss.js",
      },
    });

    const req = new NextRequest("http://localhost:3000/api/csp-report", {
      method: "POST",
      headers: {
        "content-type": "application/csp-report",
        "content-length": Buffer.byteLength(payload).toString(),
        "x-forwarded-for": "192.168.1.1",
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(warnSpy).toHaveBeenCalledWith(
      "csp.violation_reported",
      expect.objectContaining({
        ip: "192.168.1.1",
        report: expect.objectContaining({
          "csp-report": expect.any(Object),
        }),
      })
    );
  });

  it("rejects payload exceeding 8 KB with 413", async () => {
    const largeBody = "a".repeat(8193);
    const req = new NextRequest("http://localhost:3000/api/csp-report", {
      method: "POST",
      headers: {
        "content-length": "8193",
      },
      body: largeBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const invalidJson = "{ bad json ";
    const req = new NextRequest("http://localhost:3000/api/csp-report", {
      method: "POST",
      headers: {
        "content-length": Buffer.byteLength(invalidJson).toString(),
      },
      body: invalidJson,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
