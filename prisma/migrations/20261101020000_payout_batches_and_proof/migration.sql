-- CreateTable
CREATE TABLE IF NOT EXISTS public.payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_for DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

-- AlterTable payout_requests
ALTER TABLE public.payout_requests
    ADD COLUMN IF NOT EXISTS proof_url TEXT,
    ADD COLUMN IF NOT EXISTS processed_by TEXT,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS batch_id UUID;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payout_requests_batch_id_fkey') THEN
    ALTER TABLE public.payout_requests
      ADD CONSTRAINT payout_requests_batch_id_fkey
      FOREIGN KEY (batch_id) REFERENCES public.payout_batches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable seller_profiles
ALTER TABLE public.seller_profiles
    ADD COLUMN IF NOT EXISTS auto_payout BOOLEAN NOT NULL DEFAULT FALSE;
