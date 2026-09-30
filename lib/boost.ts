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
  allFiltered: ListingWithRelations[];
  isPriceSort: boolean;
  page: number;
  pageSize?: number;
  adSlotIndexes?: number[];
  seed: number;
}

export function composeFeedPage({
  allFiltered,
  isPriceSort,
  page,
  pageSize = 12,
  adSlotIndexes = [0, 5, 10],
  seed,
}: ComposeFeedPageArgs): FeedItem[] {
  // If price sort or no items, just slice the filtered list. No ads.
  if (isPriceSort || allFiltered.length === 0) {
    const start = (page - 1) * pageSize;
    return allFiltered.slice(start, start + pageSize).map((listing) => ({
      listing,
      isAd: false,
    }));
  }

  const now = Date.now();
  const boostedListings = allFiltered.filter((l) => isActiveBoost(l, now));

  // Sort pool by ID for deterministic ad assignment and shuffle with seeded PRNG
  const sortedBoosted = [...boostedListings].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const shuffledPool = seededShuffle(sortedBoosted, seed);

  const totalItems = allFiltered.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // If requested page is out of bounds, return empty
  if (page < 1 || page > totalPages) {
    return [];
  }

  // --- Global Ad Assignment ---
  // Assign ads across all pages *before* slicing for the current page.
  // This ensures ad assignment doesn't depend on `upToPage`.
  const assignedAdIds = new Set<string>();
  const pageAdAssignments: ListingWithRelations[][] = Array.from({ length: totalPages }, () => []);
  const usedSellersThisCycle = new Set<string>(); // Track sellers used across ALL assigned ads
  let poolIdx = 0;

  for (let p = 0; p < totalPages; p++) {
    const currentPageItemCount = Math.min(pageSize, totalItems - p * pageSize);
    const availableAdSlotsOnPage = adSlotIndexes.filter((slot) => slot < currentPageItemCount);

    let adsAssignedOnPage = 0;
    while (
      adsAssignedOnPage < availableAdSlotsOnPage.length &&
      poolIdx < shuffledPool.length &&
      adsAssignedOnPage < 3 // Max 3 ads per page
    ) {
      const candidate = shuffledPool[poolIdx];

      // Assign if not already used globally and seller is not used on this specific page yet
      if (!assignedAdIds.has(candidate.id) && !usedSellersThisCycle.has(candidate.sellerId)) {
        pageAdAssignments[p].push(candidate);
        assignedAdIds.add(candidate.id);
        usedSellersThisCycle.add(candidate.sellerId); // Mark seller used globally for this run
        adsAssignedOnPage++;
      }
      poolIdx++;
      if (poolIdx >= shuffledPool.length) {
        // Reset pool index if we've exhausted the shuffled pool
        // This is crucial for scenarios where ads need to be placed on many pages
        // and the pool is smaller than totalPages * maxAdsPerPage
        poolIdx = 0; // Reset to start from the beginning of the pool
      }
    }
  }

  const organicList = allFiltered.filter((l) => !assignedAdIds.has(l.id));

  // --- Page Construction ---
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageLength = endIdx - startIdx;

  const result: (FeedItem | null)[] = Array(pageLength).fill(null);
  const adsForThisPage = pageAdAssignments[page - 1];
  const availableAdSlotsForThisPage = adSlotIndexes.filter((slot) => slot < pageLength);

  // Place ads first
  for (let i = 0; i < adsForThisPage.length; i++) {
    if (i < availableAdSlotsForThisPage.length) {
      result[availableAdSlotsForThisPage[i]] = { listing: adsForThisPage[i], isAd: true };
    }
  }

  // Fill remaining slots with organic items
  let organicIdx = startIdx - assignedAdIds.size; // Adjust start index based on ads assigned *before* this page
  for (let i = 0; i < pageLength; i++) {
    if (result[i] === null) {
      if (organicIdx < organicList.length) {
        result[i] = { listing: organicList[organicIdx++], isAd: false };
      } else {
        // Should not happen if totalItems calculation is correct and pageLength is respected,
        // but as a safeguard, break if organic list is exhausted.
        break;
      }
    }
  }

  return result.filter((item) => item !== null) as FeedItem[];
}
