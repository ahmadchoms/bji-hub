import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("No DATABASE_URL found, skipping Postgres migration (mock mode).");
    return;
  }

  const pool = new Pool({ connectionString: dbUrl });

  console.log("Adding cropYear and moistureContent to taste_profiles, and coffee_origins table...");
  try {
    await pool.query(`
      -- Add cropYear and moistureContent to taste_profiles
      ALTER TABLE public.taste_profiles
      ADD COLUMN IF NOT EXISTS "cropYear" TEXT,
      ADD COLUMN IF NOT EXISTS "moistureContent" DECIMAL(4, 2);

      -- Create coffee_origins table
      CREATE TABLE IF NOT EXISTS public.coffee_origins (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        country TEXT NOT NULL,
        island_or_state TEXT,
        min_altitude INTEGER,
        max_altitude INTEGER,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_coffee_origins_country ON public.coffee_origins(country);
    `);
    console.log("Successfully migrated taste_profiles and coffee_origins!");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
