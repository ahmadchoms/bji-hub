-- Idempotent migration for COF-4: listing_flavor_tags and user_taste_preferences
CREATE TABLE IF NOT EXISTS public.listing_flavor_tags (
  listing_id text REFERENCES public.listings(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY (listing_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_listing_flavor_tags_tag ON public.listing_flavor_tags (tag);

CREATE TABLE IF NOT EXISTS public.user_taste_preferences (
  user_id uuid PRIMARY KEY,
  acidity_pref numeric(3,1),
  body_pref numeric(3,1),
  roast_pref text[] NOT NULL DEFAULT '{}',
  flavor_tags text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_taste_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_taste_preferences' AND policyname = 'Users can manage their own taste preferences'
  ) THEN
    CREATE POLICY "Users can manage their own taste preferences" ON public.user_taste_preferences
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
