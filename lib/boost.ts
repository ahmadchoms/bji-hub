import type { ListingWithRelations, FeedItem } from '@/types';

// ─── Single source of truth for active-boost check ─────────────────────────

export function isActiveBoost(
  listing: ListingWithRelations,
  now: number = Date.now()
): boolean {
  return (
    listing.isBoosted &&
    Boolean(listing.boostUntil) &&
    new Date(listing.boostUntil!).getTime() > now
  );
}

// ─── mulberry32 PRNG (no dependency) ───────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), 1 | s);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Deterministic shuffle seeded by current hour ──────────────────────────

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Feed-page composition ──────────────────────────────────────────────────

export interface ComposeFeedPageArgs {
  /** Full filtered organic list (sorted by requested sort, pool members already removed). */
  organic: ListingWithRelations[];
  /** All eligible active-boost listings for this filter set. */
  boostedPool: ListingWithRelations[];
  page: number;
  pageSize?: number;
  adSlotIndexes?: number[];
  /** Seed = Math.floor(Date.now() / 3_600_000) so it changes every hour. */
  seed: number;
}

export function composeFeedPage({
  organic,
  boostedPool,
  page,
  pageSize = 12,
  adSlotIndexes = [0, 5, 10],
  seed,
}: ComposeFeedPageArgs): FeedItem[] {
  // Sort pool by id for a stable base, then shuffle deterministically.
  const sortedPool = [...boostedPool].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const shuffledPool = seededShuffle(sortedPool, seed);

  // adsPerPage = min(available slots, unique seller count in pool)
  const uniqueSellerIds = new Set(shuffledPool.map((l) => l.sellerId));
  const adsPerPage = Math.min(adSlotIndexes.length, uniqueSellerIds.size);
  const activeSlots = adSlotIndexes.slice(0, adsPerPage);
  const organicPerPage = pageSize - adsPerPage;

  // Select ads for this page; pool cycles via modulo, max 1 per seller.
  const selectedAds: ListingWithRelations[] = [];
  if (shuffledPool.length > 0 && adsPerPage > 0) {
    const startIdx = ((page - 1) * adsPerPage) % shuffledPool.length;
    const usedSellers = new Set<string>();
    let probed = 0;
    while (selectedAds.length < adsPerPage && probed < shuffledPool.length) {
      const item = shuffledPool[(startIdx + probed) % shuffledPool.length];
      if (!usedSellers.has(item.sellerId)) {
        selectedAds.push(item);
        usedSellers.add(item.sellerId);
      }
      probed++;
    }
  }

  // Organic slice for this page.
  const organicSlice = organic.slice(
    (page - 1) * organicPerPage,
    page * organicPerPage
  );

  // Build the page: ads at activeSlots, organic everywhere else.
  const result: (FeedItem | null)[] = Array(pageSize).fill(null);
  activeSlots.forEach((slotIdx, i) => {
    if (i < selectedAds.length) {
      result[slotIdx] = { listing: selectedAds[i], isAd: true };
    }
  });
  let organicIdx = 0;
  for (let slot = 0; slot < pageSize; slot++) {
    if (result[slot] === null && organicIdx < organicSlice.length) {
      result[slot] = { listing: organicSlice[organicIdx++], isAd: false };
    }
  }

  return result.filter((item): item is FeedItem => item !== null);
}
