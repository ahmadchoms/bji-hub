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

  console.log("Adding dispute_evidence_url to orders and image_url to reviews...");
  await pool.query(`
    ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS dispute_evidence_url TEXT;

    ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS image_url TEXT;
  `);

  console.log("Successfully added dispute_evidence_url and image_url columns!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
