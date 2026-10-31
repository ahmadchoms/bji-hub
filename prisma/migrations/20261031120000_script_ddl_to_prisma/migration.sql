-- Idempotent migration moving all script DDLs into Prisma chain (A1)
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_status ON public.payout_requests(seller_id, status);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id TEXT NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS idx_review_reports_status_created ON public.review_reports(status, created_at DESC);
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Extension and search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_business_name_trgm ON public.seller_profiles USING gin ("businessName" gin_trgm_ops);

-- Integrity Constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listings_stock_nonneg') THEN
    ALTER TABLE public.listings ADD CONSTRAINT chk_listings_stock_nonneg CHECK (stock >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total_nonneg') THEN
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_total_nonneg CHECK (total_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_refunds_amount_pos') THEN
    ALTER TABLE public.refunds ADD CONSTRAINT chk_refunds_amount_pos CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reviews_rating_range') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT chk_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Align foreign key cascade rules with Prisma datamodel
DO $$ BEGIN
  ALTER TABLE public.taste_profiles DROP CONSTRAINT IF EXISTS taste_profiles_producer_id_fkey;
  ALTER TABLE public.taste_profiles ADD CONSTRAINT taste_profiles_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.producers(id) ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE public.listing_flavor_tags DROP CONSTRAINT IF EXISTS listing_flavor_tags_listing_id_fkey;
  ALTER TABLE public.listing_flavor_tags ADD CONSTRAINT listing_flavor_tags_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE public.user_taste_preferences DROP CONSTRAINT IF EXISTS user_taste_preferences_user_id_fkey;
  ALTER TABLE public.user_taste_preferences ADD CONSTRAINT user_taste_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE public.roast_batches DROP CONSTRAINT IF EXISTS roast_batches_listing_id_fkey;
  ALTER TABLE public.roast_batches ADD CONSTRAINT roast_batches_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE public.listing_waitlist DROP CONSTRAINT IF EXISTS listing_waitlist_listing_id_fkey;
  ALTER TABLE public.listing_waitlist ADD CONSTRAINT listing_waitlist_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE public.listing_waitlist DROP CONSTRAINT IF EXISTS listing_waitlist_user_id_fkey;
  ALTER TABLE public.listing_waitlist ADD CONSTRAINT listing_waitlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;
END $$;
