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

  console.log("Running migration for orders hardening and order_items...");
  await pool.query(`
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
    CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uq
      ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;

    CREATE TABLE IF NOT EXISTS public.order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      price NUMERIC(14, 2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT '250g',
      grind_size TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON public.order_items(listing_id);
  `);

  console.log("Order hardening and order_items migration completed successfully!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
