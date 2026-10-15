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

      -- Create order_items table
      CREATE TABLE IF NOT EXISTS public.order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        listing_id TEXT NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        price DECIMAL(14, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT '250g',
        grind_size TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_listing_id ON public.order_items(listing_id);

      -- Create user_addresses table
      CREATE TABLE IF NOT EXISTS public.user_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        label TEXT NOT NULL DEFAULT 'Utama',
        recipient_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        street_address TEXT NOT NULL,
        city TEXT NOT NULL,
        province TEXT NOT NULL,
        postal_code TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
    `);
    console.log("Successfully migrated taste_profiles, coffee_origins, order_items, and user_addresses!");
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
