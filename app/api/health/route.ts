import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (process.env.DATA_SOURCE !== "mock") {
      const prisma = getPrisma();
      await prisma.$queryRaw`SELECT 1`;
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
