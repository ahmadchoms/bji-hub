-- Idempotent migration for COF-5 & COF-13: roast_batches, next_roast_date, listing_waitlist
CREATE TABLE IF NOT EXISTS public.roast_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  roasted_on date NOT NULL,
  quantity_kg numeric(6,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roast_batches_listing_date ON public.roast_batches (listing_id, roasted_on DESC);

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS next_roast_date date;

CREATE TABLE IF NOT EXISTS public.listing_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_waitlist_user ON public.listing_waitlist (user_id);
CREATE INDEX IF NOT EXISTS idx_listing_waitlist_listing ON public.listing_waitlist (listing_id);

ALTER TABLE public.listing_waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listing_waitlist' AND policyname = 'Users can view and manage their own waitlist'
  ) THEN
    CREATE POLICY "Users can view and manage their own waitlist" ON public.listing_waitlist
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
