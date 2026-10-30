import { Pool } from "pg";
import { logger } from "@/lib/logger";

declare global {
  var __bijiPgPool: Pool | undefined;
}

export function getPool(): Pool | null {
  if (process.env.DATA_SOURCE === "mock") return null;
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) return null;

  if (!globalThis.__bijiPgPool) {
    const pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    });
    pool.on("error", (err) => logger.error("db.pool_error", err));
    globalThis.__bijiPgPool = pool;
  }
  return globalThis.__bijiPgPool;
}
