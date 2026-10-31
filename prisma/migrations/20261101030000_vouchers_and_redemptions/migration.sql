-- CreateTable
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    seller_id TEXT,
    type TEXT NOT NULL,
    value NUMERIC(14,2) NOT NULL,
    min_subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(14,2),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    usage_limit INT,
    per_user_limit INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign keys and constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_seller_id_fkey') THEN
    ALTER TABLE public.vouchers
      ADD CONSTRAINT vouchers_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vouchers_type') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT chk_vouchers_type CHECK (type IN ('percent','fixed','free_shipping'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vouchers_value') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT chk_vouchers_value CHECK (value >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vouchers_used_count') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT chk_vouchers_used_count CHECK (used_count >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vouchers_dates') THEN
    ALTER TABLE public.vouchers ADD CONSTRAINT chk_vouchers_dates CHECK (ends_at > starts_at);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_uq ON public.vouchers (UPPER(code));

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- CreateTable
CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL,
    user_key TEXT NOT NULL,
    order_id TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_redemptions_voucher_id_fkey') THEN
    ALTER TABLE public.voucher_redemptions
      ADD CONSTRAINT voucher_redemptions_voucher_id_fkey
      FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_voucher_redemptions_amount') THEN
    ALTER TABLE public.voucher_redemptions ADD CONSTRAINT chk_voucher_redemptions_amount CHECK (amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_redemptions_voucher_id_order_id_key') THEN
    ALTER TABLE public.voucher_redemptions
      ADD CONSTRAINT voucher_redemptions_voucher_id_order_id_key
      UNIQUE (voucher_id, order_id);
  END IF;
END $$;

ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- AlterTable
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS voucher_code TEXT,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_funded_by TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_discount_nonneg') THEN
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_discount_nonneg CHECK (discount_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_discount_funded_by') THEN
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_discount_funded_by CHECK (discount_funded_by IS NULL OR discount_funded_by IN ('platform','seller'));
  END IF;
END $$;
