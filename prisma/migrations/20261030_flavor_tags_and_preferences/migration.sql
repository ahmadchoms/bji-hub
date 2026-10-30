-- Idempotent migration for COF-4: listing_flavor_tags and user_taste_preferences
CREATE TABLE IF NOT EXISTS public.listing_flavor_tags (
  listing_id text REFERENCES public.listings(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY (listing_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_listing_flavor_tags_tag ON public.listing_flavor_tags (tag);
ALTER TABLE public.listing_flavor_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_taste_preferences (
  user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  acidity_pref numeric(3,1),
  body_pref numeric(3,1),
  roast_pref text[] NOT NULL DEFAULT '{}',
  flavor_tags text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_taste_preferences ENABLE ROW LEVEL SECURITY;
