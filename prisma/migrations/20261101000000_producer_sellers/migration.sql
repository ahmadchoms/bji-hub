-- CreateTable
CREATE TABLE IF NOT EXISTS public.producer_sellers (
  producer_id TEXT NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  seller_id TEXT NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  evidence_url TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (producer_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_producer_sellers_seller_status ON public.producer_sellers (seller_id, status);

ALTER TABLE public.producer_sellers ENABLE ROW LEVEL SECURITY;
