import "server-only";
import { getPool } from "@/lib/db/pool";
import { mockListings } from "@/lib/mock/data";

export interface LotCuppingData {
  lot_code: string;
  origin_region: string;
  process_method: string;
  roast_level: string;
  flavor_notes?: string | null;
  acidity_score?: number | string | null;
  body_score?: number | string | null;
  sweetness_score?: number | string | null;
  aroma_score?: number | string | null;
  aftertaste_score?: number | string | null;
  cupping_score?: number | string | null;
  crop_year?: string | null;
  altitude?: string | null;
  varieties?: string[] | null;
  listing_id: string;
  listing_title: string;
  listing_slug?: string | null;
  price: number;
  producer_name?: string | null;
  producer_village?: string | null;
  producer_kind?: string | null;
}

export async function getLotCuppingData(lotCode: string): Promise<LotCuppingData | null> {
  const normalized = lotCode.trim();
  if (!/^[A-Za-z0-9-]{3,40}$/.test(normalized)) {
    return null;
  }

  if (process.env.DATA_SOURCE === "mock") {
    const listing = mockListings.find(
      (l) => l.tasteProfile?.lotCode?.toUpperCase() === normalized.toUpperCase()
    );
    if (!listing || !listing.tasteProfile) {
      return null;
    }
    return {
      lot_code: listing.tasteProfile.lotCode || normalized,
      origin_region: listing.tasteProfile.originRegion || "Indonesia",
      process_method: listing.tasteProfile.processMethod || "Wash",
      roast_level: listing.tasteProfile.roastLevel || "Medium",
      flavor_notes: listing.tasteProfile.flavorNotes || null,
      acidity_score: listing.tasteProfile.acidityScore ?? null,
      body_score: listing.tasteProfile.bodyScore ?? null,
      sweetness_score: listing.tasteProfile.sweetnessScore ?? null,
      aroma_score: listing.tasteProfile.aromaScore ?? null,
      aftertaste_score: listing.tasteProfile.aftertasteScore ?? null,
      cupping_score: listing.tasteProfile.cuppingScore ?? null,
      crop_year: listing.tasteProfile.cropYear ?? "2026",
      altitude: listing.tasteProfile.altitude ?? null,
      varieties: listing.tasteProfile.varieties ?? [],
      listing_id: listing.id,
      listing_title: listing.title,
      listing_slug: listing.slug,
      price: listing.price,
      producer_name: listing.tasteProfile.producer?.name || null,
      producer_village: listing.tasteProfile.producer?.village || null,
      producer_kind: listing.tasteProfile.producer?.kind || null,
    };
  }

  const pool = getPool();
  if (!pool) {
    throw new Error("Database pool not available");
  }

  const res = await pool.query(
    `SELECT tp.lot_code,
            tp."originRegion" AS origin_region,
            tp."processMethod" AS process_method,
            tp."roastLevel" AS roast_level,
            tp."flavorNotes" AS flavor_notes,
            tp."acidityScore" AS acidity_score,
            tp."bodyScore" AS body_score,
            tp."sweetnessScore" AS sweetness_score,
            tp."aromaScore" AS aroma_score,
            tp."aftertasteScore" AS aftertaste_score,
            tp.cupping_score,
            tp."cropYear" AS crop_year,
            tp.altitude,
            tp.varieties,
            l.id AS listing_id,
            l.title AS listing_title,
            l.slug AS listing_slug,
            l.price,
            CASE WHEN (ps.status = 'approved' OR p.claims_verified_at IS NOT NULL) THEN p.name ELSE NULL END AS producer_name,
            CASE WHEN (ps.status = 'approved' OR p.claims_verified_at IS NOT NULL) THEN p.village ELSE NULL END AS producer_village,
            CASE WHEN (ps.status = 'approved' OR p.claims_verified_at IS NOT NULL) THEN p.kind ELSE NULL END AS producer_kind
     FROM public.taste_profiles tp
     JOIN public.listings l ON l.id = tp."listingId"
     LEFT JOIN public.producers p ON tp.producer_id = p.id
     LEFT JOIN public.producer_sellers ps ON ps.producer_id = p.id AND ps.seller_id = l."sellerId" AND ps.status = 'approved'
     WHERE UPPER(tp.lot_code) = UPPER($1) AND l.status = 'active'
     LIMIT 1`,
    [normalized]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return res.rows[0] as LotCuppingData;
}
