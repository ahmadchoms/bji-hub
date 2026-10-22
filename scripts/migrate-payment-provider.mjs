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

  console.log("Running migration for payment_provider column in orders...");
  await pool.query(`
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'midtrans';
  `);

  console.log("payment_provider migration completed successfully!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
