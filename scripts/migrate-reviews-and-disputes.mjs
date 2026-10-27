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

  console.log("Running migration for reviews table and order dispute_reason column...");
  await pool.query(`
    -- Create reviews table
    CREATE TABLE IF NOT EXISTS public.reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
      buyer_id TEXT,
      buyer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_listing_uq ON public.reviews (order_id, listing_id) WHERE order_id IS NOT NULL;

    -- Add dispute_reason column to orders
    ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

    -- Ensure non-negative stock constraint on listings (B7)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listings_stock_check'
      ) THEN
        ALTER TABLE public.listings ADD CONSTRAINT listings_stock_check CHECK (stock >= 0);
      END IF;
    END $$;

    -- Create refunds table (B6)
    CREATE TABLE IF NOT EXISTS public.refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL CHECK (amount > 0),
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed', 'manual_required')),
      provider_ref TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
  `);

  console.log("Reviews table and dispute_reason column verified in PostgreSQL!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
