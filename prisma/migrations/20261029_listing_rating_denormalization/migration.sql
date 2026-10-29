-- Idempotent migration: denormalize rating_avg and rating_count on listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_rating_avg_count
  ON public.listings (rating_avg DESC NULLS LAST, rating_count DESC);

-- Backfill from approved reviews
WITH rating_aggregates AS (
  SELECT
    listing_id,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating,
    COUNT(*)::int AS cnt
  FROM public.reviews
  WHERE moderation_status = 'approved' OR moderation_status IS NULL
  GROUP BY listing_id
)
UPDATE public.listings l
SET
  rating_avg = ra.avg_rating,
  rating_count = ra.cnt
FROM rating_aggregates ra
WHERE l.id = ra.listing_id;
