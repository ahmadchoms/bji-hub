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

  console.log("Running migration for seller bank details and payout_requests table...");
  await pool.query(`
    -- Add bank details to seller_profiles if not present
    ALTER TABLE public.seller_profiles
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

    -- Create payout_requests table
    CREATE TABLE IF NOT EXISTS public.payout_requests (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
      amount NUMERIC(14, 2) NOT NULL,
      bank_name TEXT NOT NULL,
      bank_account_number TEXT NOT NULL,
      bank_account_holder TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON public.payout_requests(seller_id);
    CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
  `);

  console.log("Payouts table & seller bank columns created/verified successfully in PostgreSQL!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
