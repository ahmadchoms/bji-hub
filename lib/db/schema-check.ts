import fs from "node:fs";
import path from "node:path";
import { getPool } from "@/lib/db/pool";

export interface SchemaStatus {
  ok: boolean;
  mode: "mock" | "db";
  expected?: number;
  applied?: number;
  missing: string[];
}

export async function getSchemaStatus(): Promise<SchemaStatus> {
  const pool = getPool();
  if (!pool) return { ok: true, mode: "mock", missing: [] };

  const dir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(dir)) {
    return { ok: false, mode: "db", missing: ["migrations directory not found"] };
  }

  const expected = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  try {
    const res = await pool.query(
      `SELECT migration_name FROM public._prisma_migrations
       WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    );
    const applied = new Set<string>(
      res.rows.map((row: { migration_name: string }) => row.migration_name),
    );
    const missing = expected.filter((name) => !applied.has(name));
    return {
      ok: missing.length === 0,
      mode: "db",
      expected: expected.length,
      applied: applied.size,
      missing,
    };
  } catch {
    // If _prisma_migrations table doesn't exist (DB not baselined)
    return {
      ok: false,
      mode: "db",
      expected: expected.length,
      applied: 0,
      missing: expected,
    };
  }
}
