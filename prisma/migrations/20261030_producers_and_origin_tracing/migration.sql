-- Idempotent migration: producers and traceable coffee origins (COF-2)
CREATE TABLE IF NOT EXISTS public.producers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('petani','koperasi','estate','processor')),
  origin_id text,
  village text,
  province text,
  altitude_min int,
  altitude_max int,
  farmers_count int,
  story text,
  certifications text[] NOT NULL DEFAULT '{}',
  claims_verified_at timestamptz,
  photo_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'producers' AND policyname = 'Allow public read access on producers'
  ) THEN
    CREATE POLICY "Allow public read access on producers" ON public.producers FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_producers_slug ON public.producers (slug);
CREATE INDEX IF NOT EXISTS idx_producers_origin_id ON public.producers (origin_id);

ALTER TABLE public.taste_profiles
  ADD COLUMN IF NOT EXISTS producer_id uuid REFERENCES public.producers(id),
  ADD COLUMN IF NOT EXISTS lot_code text,
  ADD COLUMN IF NOT EXISTS varieties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS harvest_month smallint CHECK (harvest_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS fermentation_hours int,
  ADD COLUMN IF NOT EXISTS drying_days int;

CREATE INDEX IF NOT EXISTS idx_taste_profiles_producer_id ON public.taste_profiles (producer_id);
