import type { ListingWithRelations, FeedItem } from "@/types";

// ─── Single source of truth for active-boost check ─────────────────────────

export function isActiveBoost(
  listing: ListingWithRelations,
  now: number = Date.now(),
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

function buildFullFeed({
  allFiltered,
  isPriceSort,
  pageSize = 12,
  adSlotIndexes = [0, 5, 10],
  seed,
}: Omit<ComposeFeedPageArgs, "page">): FeedItem[] {
  if (isPriceSort || allFiltered.length === 0) {
    return allFiltered.map((listing) => ({ listing, isAd: false }));
  }

  const now = Date.now();
  const remaining = seededShuffle(
    allFiltered
      .filter((l) => isActiveBoost(l, now))
      .sort((a, b) => a.id.localeCompare(b.id)),
    seed,
  );

  const total = allFiltered.length;
  const totalPages = Math.ceil(total / pageSize);
  const adsByPage: ListingWithRelations[][] = [];
  const adIds = new Set<string>();

  // Assign ads page by page: no wrap-around, max 1 ad per seller per page.
  for (let p = 0; p < totalPages; p++) {
    const itemsOnPage = Math.min(pageSize, total - p * pageSize);
    const slots = adSlotIndexes.filter((s) => s < itemsOnPage);
    const usedSellers = new Set<string>();
    const pageAds: ListingWithRelations[] = [];

    for (let s = 0; s < slots.length; s++) {
      const idx = remaining.findIndex((c) => !usedSellers.has(c.sellerId));
      if (idx === -1) break;
      const [ad] = remaining.splice(idx, 1);
      usedSellers.add(ad.sellerId);
      adIds.add(ad.id);
      pageAds.push(ad);
    }
    adsByPage.push(pageAds);
  }

  // Unassigned boosts stay in the organic list without the ad flag.
  const organic = allFiltered.filter((l) => !adIds.has(l.id));
  const feed: FeedItem[] = [];
  let organicIdx = 0;

  for (let p = 0; p < totalPages; p++) {
    const itemsOnPage = Math.min(pageSize, total - p * pageSize);
    const slots = adSlotIndexes.filter((s) => s < itemsOnPage);
    const pageAds = adsByPage[p];

    for (let i = 0; i < itemsOnPage; i++) {
      const adPos = slots.indexOf(i);
      if (adPos !== -1 && adPos < pageAds.length) {
        feed.push({ listing: pageAds[adPos], isAd: true });
      } else {
        feed.push({ listing: organic[organicIdx++], isAd: false });
      }
    }
  }

  return feed;
}

export function composeFeedPage(args: ComposeFeedPageArgs): FeedItem[] {
  const { page, pageSize = 12 } = args;
  if (page < 1) return [];
  const start = (page - 1) * pageSize;
  return buildFullFeed(args).slice(start, start + pageSize);
}
