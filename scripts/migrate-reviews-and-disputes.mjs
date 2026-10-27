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

    -- Create refunds table (B6 / N1)
    CREATE TABLE IF NOT EXISTS public.refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL CHECK (amount > 0),
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed', 'manual_required')),
      provider_ref TEXT,
      created_by TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      failure_reason TEXT,
      resolved_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
    ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS failure_reason text;
    ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS resolved_by text;
    CREATE UNIQUE INDEX IF NOT EXISTS refunds_order_uq ON public.refunds (order_id);

    -- Create audit_logs table (F2)
    CREATE TABLE IF NOT EXISTS public.audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      target_type TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON public.audit_logs(target_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

    -- Suspend columns (F3)
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
    ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

    -- Webhook events for replay protection & idempotency (S5)
    CREATE TABLE IF NOT EXISTS public.webhook_events (
      event_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'midtrans',
      order_ref TEXT,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_events_order_ref ON public.webhook_events(order_ref);

    -- Notifications table (F1)
    CREATE TABLE IF NOT EXISTS public.notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      link TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(user_id, created_at DESC);

    -- Trigram search indexes (F5)
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin (title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_seller_profiles_business_name_trgm ON public.seller_profiles USING gin (business_name gin_trgm_ops);
  `);

  console.log("Reviews table and dispute_reason column verified in PostgreSQL!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
