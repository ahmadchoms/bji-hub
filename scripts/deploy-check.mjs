#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("\n==================================================");
console.log("  BIJI CORP - PRODUCTION & DEPLOYMENT PREFLIGHT   ");
console.log("==================================================\n");

let warnings = 0;
let passes = 0;
let fatalErrors = 0;

function check(label, condition, advice, isFatal = false) {
  if (condition) {
    console.log(`  [OK] ${label}`);
    passes++;
  } else {
    console.log(`  [${isFatal ? "FAIL" : "WARN"}] ${label}`);
    if (advice) console.log(`         -> ${advice}`);
    if (isFatal) {
      fatalErrors++;
    } else {
      warnings++;
    }
  }
}

async function main() {
  // 1. Prisma Client generation check
  const prismaClientExists = existsSync(join(process.cwd(), "lib", "generated", "prisma"));
  check(
    "Prisma Client Generated",
    prismaClientExists,
    "Run 'npx prisma generate' to generate Prisma client for adapter-pg."
  );

  // 2. Data source check & target DB migration verification
  const dataSource = process.env.DATA_SOURCE || "mock";
  console.log(`  [INFO] Active Data Source: ${dataSource.toUpperCase()}`);
  if (dataSource === "prisma") {
    check(
      "DATABASE_URL configured",
      Boolean(process.env.DATABASE_URL),
      "DATABASE_URL required when DATA_SOURCE=prisma."
    );

    if (process.env.DATABASE_URL) {
      const { Client } = pg;
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      try {
        await client.connect();
        const migrationsDir = join(process.cwd(), "prisma", "migrations");
        const expected = existsSync(migrationsDir)
          ? readdirSync(migrationsDir, { withFileTypes: true })
              .filter((d) => d.isDirectory())
              .map((d) => d.name)
              .sort()
          : [];

        const res = await client.query(
          `SELECT migration_name FROM public._prisma_migrations
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
        );
        const applied = new Set(res.rows.map((r) => r.migration_name));
        const missing = expected.filter((name) => !applied.has(name));

        check(
          "Target DB Migrations Status",
          missing.length === 0,
          missing.length > 0
            ? `DILARANG DEPLOY: Target DB tertinggal ${missing.length} migrasi (${missing.join(", ")}). Jalankan 'npx prisma migrate deploy' dahulu!`
            : undefined,
          true
        );
      } catch (err) {
        check(
          "Target DB Connection & Migrations Table",
          false,
          `Gagal memeriksa migrasi target DB: ${err.message}. Pastikan DB aktif dan tabel migrasi sudah ada.`,
          true
        );
      } finally {
        await client.end().catch(() => {});
      }
    }
  } else {
    console.log("         (Running in mock mode. For live deployment, set DATA_SOURCE=prisma with Supabase/Neon PostgreSQL).");
  }

  // 3. Midtrans Payment configuration
  check(
    "Midtrans Server Key configured",
    Boolean(process.env.MIDTRANS_SERVER_KEY),
    "Set MIDTRANS_SERVER_KEY in production to process online payments."
  );
  check(
    "Midtrans Client Key configured",
    Boolean(process.env.MIDTRANS_CLIENT_KEY),
    "Set MIDTRANS_CLIENT_KEY for Snap.js frontend checkout popup."
  );

  const isProductionMidtrans = process.env.MIDTRANS_IS_PRODUCTION === "true";
  console.log(`  [INFO] Midtrans Environment: ${isProductionMidtrans ? "PRODUCTION (LIVE)" : "SANDBOX (TESTING)"}`);

  // 4. Supabase Storage & Auth
  check(
    "Supabase URL configured",
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Set NEXT_PUBLIC_SUPABASE_URL for cloud image storage & auth."
  );
  check(
    "Supabase Anon Key configured",
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    "Set NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase SDK access."
  );
  check(
    "Supabase Service Role Key configured",
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    "Set SUPABASE_SERVICE_ROLE_KEY for secure account deletion and admin operations."
  );

  // 5. Background Maintenance & Health Check Auth
  check(
    "CRON_SECRET configured",
    Boolean(process.env.CRON_SECRET),
    "Set CRON_SECRET to authenticate deep health check (/api/health?deep=1) and maintenance endpoints."
  );

  // 6. Transactional Email
  check(
    "Resend API Key configured",
    Boolean(process.env.RESEND_API_KEY),
    "Set RESEND_API_KEY to send real order confirmation & shipping notification emails."
  );

  // 7. Error Monitoring & APM
  check(
    "Sentry DSN configured",
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
    "Set NEXT_PUBLIC_SENTRY_DSN in Vercel to capture production errors."
  );

  console.log("\n--------------------------------------------------");
  console.log(`  Result: ${passes} passed, ${warnings} warnings, ${fatalErrors} fatal`);
  console.log("--------------------------------------------------\n");

  if (fatalErrors > 0) {
    console.error("❌ CRITICAL: Release gate failed. Target database has unapplied migrations or connection errors.\n");
    process.exit(1);
  }

  if (warnings === 0) {
    console.log("🚀 All preflight checks passed! Project is ready for production deployment.\n");
  } else {
    console.log("💡 Notes for Vercel / Cloud deployment:");
    console.log("   1. Create PostgreSQL database on Supabase (free tier) or Neon.");
    console.log("   2. Run 'npx prisma migrate deploy' to apply schemas to remote DB.");
    console.log("   3. Run 'npm run db:seed' to seed initial coffee beans & categories.");
    console.log("   4. Set above environment variables in Vercel project settings.\n");
  }
}

main().catch((err) => {
  console.error("Preflight execution error:", err);
  process.exit(1);
});
