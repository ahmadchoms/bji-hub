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

  console.log("Running migration for orders table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      buyer_id TEXT,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      buyer_address TEXT NOT NULL,
      buyer_city TEXT NOT NULL,
      seller_id TEXT NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
      listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      item_price NUMERIC(14, 2) NOT NULL,
      subtotal NUMERIC(14, 2) NOT NULL,
      shipping_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
      service_fee NUMERIC(14, 2) NOT NULL DEFAULT 1500,
      total_amount NUMERIC(14, 2) NOT NULL,
      shipping_courier TEXT,
      tracking_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      snap_token TEXT,
      midtrans_order_id TEXT UNIQUE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
  `);

  console.log("Orders table created/verified successfully in PostgreSQL!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
