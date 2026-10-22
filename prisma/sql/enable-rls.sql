-- Enable Row Level Security (RLS) on all public tables in Supabase Postgres
-- Idempotent script: Safe to run multiple times in Supabase SQL Editor
-- Instructions: Copy and run this script in Supabase Dashboard -> SQL Editor

DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE '_prisma%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
        -- Deny direct access via Supabase PostgREST client for anon/authenticated roles.
        -- Next.js Server Actions and SSR use Prisma Direct/Pooler connection (role: postgres) which bypasses RLS.
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', tbl.tablename);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', tbl.tablename);
    END LOOP;
END $$;

-- Policies for public catalog read if direct PostgREST client queries are ever enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Listing') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'Listing' AND policyname = 'Allow public read active listings'
        ) THEN
            CREATE POLICY "Allow public read active listings" ON public."Listing"
                FOR SELECT TO anon, authenticated USING (status = 'active');
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Category') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'Category' AND policyname = 'Allow public read categories'
        ) THEN
            CREATE POLICY "Allow public read categories" ON public."Category"
                FOR SELECT TO anon, authenticated USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'CoffeeOrigin') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'CoffeeOrigin' AND policyname = 'Allow public read origins'
        ) THEN
            CREATE POLICY "Allow public read origins" ON public."CoffeeOrigin"
                FOR SELECT TO anon, authenticated USING ("isActive" = true);
        END IF;
    END IF;
END $$;
