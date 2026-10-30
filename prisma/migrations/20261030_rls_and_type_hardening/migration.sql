-- Idempotent RLS hardening and type alignment (F2, F4)
ALTER TABLE IF EXISTS public.listing_flavor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roast_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listing_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_taste_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.producers ENABLE ROW LEVEL SECURITY;

-- Drop non-portable auth.uid() policies
DO $$
BEGIN
  IF to_regclass('public.user_taste_preferences') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can manage their own taste preferences" ON public.user_taste_preferences;
  END IF;
  IF to_regclass('public.listing_waitlist') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view and manage their own waitlist" ON public.listing_waitlist;
  END IF;
END $$;

-- Ensure portable public read policy on producers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'producers' AND policyname = 'Allow public read access on producers'
  ) THEN
    CREATE POLICY "Allow public read access on producers" ON public.producers FOR SELECT USING (true);
  END IF;
END $$;

-- Align user_id types with users.id (text)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_taste_preferences' AND column_name = 'user_id' AND data_type != 'text'
  ) THEN
    ALTER TABLE public.user_taste_preferences ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_waitlist' AND column_name = 'user_id' AND data_type != 'text'
  ) THEN
    ALTER TABLE public.listing_waitlist ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'producers' AND column_name = 'id' AND data_type != 'text'
  ) THEN
    ALTER TABLE public.taste_profiles DROP CONSTRAINT IF EXISTS taste_profiles_producer_id_fkey;
    ALTER TABLE public.taste_profiles ALTER COLUMN producer_id TYPE text USING producer_id::text;
    ALTER TABLE public.producers ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE public.producers ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    ALTER TABLE public.taste_profiles
      ADD CONSTRAINT taste_profiles_producer_id_fkey
      FOREIGN KEY (producer_id) REFERENCES public.producers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure foreign keys exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_taste_preferences_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_taste_preferences
      ADD CONSTRAINT user_taste_preferences_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- SLA roast date snapshot column on orders (F4)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS roast_date_at_ship date;
