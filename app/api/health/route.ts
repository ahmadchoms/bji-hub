import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

let lastDbCheck = 0;
const DB_CHECK_TTL_MS = 10_000;

export async function GET() {
  try {
    const now = Date.now();
    if (process.env.DATA_SOURCE !== "mock") {
      if (now - lastDbCheck >= DB_CHECK_TTL_MS) {
        const prisma = getPrisma();
        await prisma.$queryRaw`SELECT 1`;
        lastDbCheck = now;
      }
    }
    return NextResponse.json(
      { status: "ok" },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    lastDbCheck = 0;
    logger.error("health.check_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { status: "unhealthy" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
