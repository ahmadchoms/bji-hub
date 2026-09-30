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
  if (isPriceSort || allFiltered.length === 0) {
    const start = (page - 1) * pageSize;
    return allFiltered.slice(start, start + pageSize).map((listing) => ({ listing, isAd: false }));
  }

  const now = Date.now();
  const boostedListings = allFiltered.filter((l) => isActiveBoost(l, now));

  const sortedBoosted = [...boostedListings].sort((a, b) => a.id.localeCompare(b.id));
  const shuffledPool = seededShuffle(sortedBoosted, seed);

  const totalPages = Math.ceil(allFiltered.length / pageSize);
  if (page > totalPages || page < 1) {
    return [];
  }

  const assignedAdIds = new Set<string>();
  const pageAdAssignments: ListingWithRelations[][] = Array.from({ length: totalPages }, () => []);
  let poolIndex = 0;

  for (let p = 0; p < totalPages; p++) {
    const pageStartIndex = p * pageSize;
    const pageEndIndex = Math.min(pageStartIndex + pageSize, allFiltered.length);
    const pageItemsCount = pageEndIndex - pageStartIndex;

    const availableAdSlots = adSlotIndexes.filter((slot) => slot < pageItemsCount);
    const usedSellersOnPage = new Set<string>();
    let scanned = 0;
    const startPoolIndex = poolIndex;

    while (pageAdAssignments[p].length < availableAdSlots.length && scanned < shuffledPool.length) {
      const candidateIdx = (startPoolIndex + scanned) % shuffledPool.length;
      const candidate = shuffledPool[candidateIdx];

      if (!assignedAdIds.has(candidate.id) && !usedSellersOnPage.has(candidate.sellerId)) {
        pageAdAssignments[p].push(candidate);
        assignedAdIds.add(candidate.id);
        usedSellersOnPage.add(candidate.sellerId);
        poolIndex = candidateIdx + 1;
      }
      scanned++;
    }
  }

  const organicList = allFiltered.filter((l) => !assignedAdIds.has(l.id));

  let pastAdsCount = 0;
  for (let p = 0; p < page - 1; p++) {
    pastAdsCount += pageAdAssignments[p].length;
  }
  const organicStartIdx = (page - 1) * pageSize - pastAdsCount;

  const pageStartIndex = (page - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, allFiltered.length);
  const pageItemsCount = pageEndIndex - pageStartIndex;

  const adsForThisPage = pageAdAssignments[page - 1];
  const availableAdSlotsForThisPage = adSlotIndexes.filter((slot) => slot < pageItemsCount);

  const result: (FeedItem | null)[] = Array(pageItemsCount).fill(null);

  for (let i = 0; i < adsForThisPage.length; i++) {
    result[availableAdSlotsForThisPage[i]] = { listing: adsForThisPage[i], isAd: true };
  }

  let organicIdx = organicStartIdx;
  for (let i = 0; i < pageItemsCount; i++) {
    if (result[i] === null) {
      result[i] = { listing: organicList[organicIdx++], isAd: false };
    }
  }

  return result as FeedItem[];
}
