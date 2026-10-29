-- Add moderation_status and admin_approved_at to reviews table
ALTER TABLE IF EXISTS public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews(moderation_status);
