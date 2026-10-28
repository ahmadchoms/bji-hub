import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

let lastDbCheck = 0;
const DB_CHECK_TTL_MS = 10_000;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isDeep = url.searchParams.get("deep") === "1";

  // Deep diagnostic check (M13 observability & S6)
  if (isDeep) {
    // S6: Disallow token in query string (prevents leakage in logs and history)
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const secret = process.env.HEALTH_CHECK_TOKEN || process.env.CRON_SECRET;

    const isAuthorized =
      process.env.NODE_ENV !== "production" ||
      (Boolean(secret) && Boolean(bearerToken) && safeEqual(bearerToken!, secret!));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const checks: {
      database: string;
      storage: string;
      payment: { status: string; environment: string };
      email: string;
    } = {
      database: "ok",
      storage: "ok",
      payment: {
        status: "ok",
        environment: process.env.MIDTRANS_IS_PRODUCTION === "true" ? "production" : "sandbox",
      },
      email: process.env.RESEND_API_KEY ? "configured" : "mock_fallback",
    };

    let isHealthy = true;

    // Live DB check without TTL cache
    try {
      if (process.env.DATA_SOURCE !== "mock") {
        const prisma = getPrisma();
        await prisma.$queryRaw`SELECT 1`;
      }
    } catch (err) {
      isHealthy = false;
      checks.database = "down";
      logger.error("health.deep_db_check_failed", err);
    }

    // Storage configuration check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      isHealthy = false;
      checks.storage = "missing_configuration";
    }

    // Payment configuration check
    if (!process.env.MIDTRANS_SERVER_KEY) {
      isHealthy = false;
      checks.payment.status = "missing_server_key";
    }

    return NextResponse.json(
      {
        status: isHealthy ? "ok" : "unhealthy",
        deep: true,
        checks,
        timestamp: new Date().toISOString(),
      },
      {
        status: isHealthy ? 200 : 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }

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
    logger.error("health.check_failed", err);
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
