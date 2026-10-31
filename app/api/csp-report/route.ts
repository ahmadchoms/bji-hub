import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_PAYLOAD_BYTES = 8 * 1024; // 8 KB

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  const rateCheck = await checkRateLimit(`csp:${ip}`, 60, 60_000);
  if (!rateCheck.success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  try {
    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return new NextResponse("Payload Too Large", { status: 413 });
    }

    let report: unknown = null;
    if (rawText) {
      report = JSON.parse(rawText);
    }

    logger.warn("csp.violation_reported", {
      ip,
      userAgent: req.headers.get("user-agent") || undefined,
      report,
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Non-JSON or malformed payload
    logger.warn("csp.malformed_report", {
      ip,
      error: (err as Error).message,
    });
    return new NextResponse("Bad Request", { status: 400 });
  }
}
