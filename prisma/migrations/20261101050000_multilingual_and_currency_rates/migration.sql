-- AlterTable
ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS title_en TEXT,
    ADD COLUMN IF NOT EXISTS description_en TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS public.currency_rates (
    code TEXT PRIMARY KEY,
    per_idr NUMERIC(18,8) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Seed default display currency rates (C5)
INSERT INTO public.currency_rates (code, per_idr, updated_at)
VALUES
    ('USD', 0.00006300, NOW()),
    ('EUR', 0.00005900, NOW()),
    ('SGD', 0.00008400, NOW()),
    ('JPY', 0.00950000, NOW()),
    ('MYR', 0.00028000, NOW()),
    ('AUD', 0.00009700, NOW())
ON CONFLICT (code) DO NOTHING;
