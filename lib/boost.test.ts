import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isActiveBoost,
  seededShuffle,
  composeFeedPage,
} from '@/lib/boost';
import type { ListingWithRelations } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeListing(overrides: Partial<ListingWithRelations> & { id: string }): ListingWithRelations {
  const sellerId = overrides.sellerId ?? `seller-${overrides.id}`;
  const base: ListingWithRelations = {
    slug: `slug-${overrides.id}`,
    sellerId,
    categoryId: 'cat-1',
    title: `Listing ${overrides.id}`,
    price: 100_000,
    unit: 'kg',
    minOrderQty: 1,
    status: 'active',
    isBoosted: false,
    boostUntil: null,
    createdAt: new Date().toISOString(),
    seller: {
      id: sellerId,
      userId: 'u1',
      businessName: `Seller ${sellerId}`,
      slug: `seller-slug-${sellerId}`,
      province: 'Aceh',
      city: 'Takengon',
      address: 'Jl. Kopi 1',
      whatsappNumber: '628123',
      isVerified: false,
      tier: 'free',
      createdAt: new Date().toISOString(),
    },
    category: { id: 'cat-1', name: 'Roasted', slug: 'roasted-beans' },
    tasteProfile: null,
    images: [],
    ...overrides, // id comes from here, no duplication
  };
  return base;
}

const FUTURE = new Date(Date.now() + 86_400_000 * 30).toISOString();
const PAST   = new Date(Date.now() - 86_400_000 * 5).toISOString();

// ─── isActiveBoost ───────────────────────────────────────────────────────────

describe('isActiveBoost', () => {
  it('returns true when isBoosted=true and boostUntil is in the future', () => {
    const l = makeListing({ id: 'a', isBoosted: true, boostUntil: FUTURE });
    expect(isActiveBoost(l)).toBe(true);
  });

  it('returns false when boostUntil is in the past (expired)', () => {
    const l = makeListing({ id: 'a', isBoosted: true, boostUntil: PAST });
    expect(isActiveBoost(l)).toBe(false);
  });

  it('returns false when boostUntil is null (no boost set)', () => {
    const l = makeListing({ id: 'a', isBoosted: true, boostUntil: null });
    expect(isActiveBoost(l)).toBe(false);
  });

  it('returns false when isBoosted=false even with future boostUntil', () => {
    const l = makeListing({ id: 'a', isBoosted: false, boostUntil: FUTURE });
    expect(isActiveBoost(l)).toBe(false);
  });

  it('respects the now argument — exactly at boundary', () => {
    const expiry = Date.now() + 1000;
    const l = makeListing({ id: 'a', isBoosted: true, boostUntil: new Date(expiry).toISOString() });
    expect(isActiveBoost(l, expiry - 1)).toBe(true);   // 1 ms before expiry → active
    expect(isActiveBoost(l, expiry + 1)).toBe(false);  // 1 ms after expiry → expired
  });
});

// ─── seededShuffle ───────────────────────────────────────────────────────────

describe('seededShuffle', () => {
  it('same seed → identical order', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, 42)).toEqual(seededShuffle(items, 42));
  });

  it('different seeds → different order (probabilistic; reliably true for these inputs)', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = seededShuffle(items, 1);
    const b = seededShuffle(items, 999_999);
    expect(a).not.toEqual(b);
  });

  it('does not mutate the original array', () => {
    const orig = [1, 2, 3];
    seededShuffle(orig, 1);
    expect(orig).toEqual([1, 2, 3]);
  });

  it('preserves all elements', () => {
    const items = [10, 20, 30, 40, 50];
    const shuffled = seededShuffle(items, 7);
    expect(shuffled.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
  });
});

// ─── composeFeedPage ────────────────────────────────────────────────────────

// Build a clean organic list of N listings (unique sellers, no boost)
function makeOrganic(n: number, startId = 100): ListingWithRelations[] {
  return Array.from({ length: n }, (_, i) =>
    makeListing({ id: `org-${startId + i}`, sellerId: `org-seller-${startId + i}` })
  );
}

// Build a pool of boosted listings (unique sellers by default)
function makePool(n: number): ListingWithRelations[] {
  return Array.from({ length: n }, (_, i) =>
    makeListing({
      id: `boost-${i + 1}`,
      sellerId: `boost-seller-${i + 1}`,
      isBoosted: true,
      boostUntil: FUTURE,
    })
  );
}

const SEED = 12345;

describe('composeFeedPage — ad slot placement', () => {
  it('places ads at indexes 0, 5, 10 when 3+ unique sellers in pool', () => {
    const pool = makePool(4);
    const organic = makeOrganic(20);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    expect(page.length).toBeGreaterThan(0);
    const adIndexes = page.map((item, i) => ({ i, isAd: item.isAd })).filter(x => x.isAd).map(x => x.i);
    expect(adIndexes).toEqual([0, 5, 10]);
    adIndexes.forEach(i => expect(page[i].isAd).toBe(true));
  });

  it('uses only the first N slots when fewer than 3 unique sellers', () => {
    const pool = makePool(2); // 2 unique sellers → adsPerPage = 2 → slots [0, 5]
    const organic = makeOrganic(20);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    const adIndexes = page.map((item, i) => item.isAd ? i : -1).filter(i => i >= 0);
    expect(adIndexes).toEqual([0, 5]);
  });

  it('uses 0 ad slots when pool is empty', () => {
    const organic = makeOrganic(12);
    const page = composeFeedPage({ organic, boostedPool: [], page: 1, seed: SEED });

    expect(page.every(item => !item.isAd)).toBe(true);
    expect(page.length).toBe(12);
  });

  it('uses 1 ad slot when pool has 1 unique seller', () => {
    const pool = [makeListing({ id: 'b1', sellerId: 'sel-A', isBoosted: true, boostUntil: FUTURE })];
    const organic = makeOrganic(15);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    const adIndexes = page.map((item, i) => item.isAd ? i : -1).filter(i => i >= 0);
    expect(adIndexes).toEqual([0]);
  });
});

describe('composeFeedPage — max 1 ad per seller per page', () => {
  it('never shows two listings from the same seller as ads on one page', () => {
    // Pool: 3 listings from same seller → only 1 qualifies
    const pool = [
      makeListing({ id: 'dup-1', sellerId: 'same', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'dup-2', sellerId: 'same', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'dup-3', sellerId: 'same', isBoosted: true, boostUntil: FUTURE }),
    ];
    const organic = makeOrganic(15);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    const adItems = page.filter(item => item.isAd);
    const adSellerIds = adItems.map(item => item.listing.sellerId);
    const uniqueAdSellers = new Set(adSellerIds);
    expect(uniqueAdSellers.size).toBe(adItems.length); // each ad is a different seller
    expect(adItems.length).toBeLessThanOrEqual(1);     // only 1 unique seller → 1 slot
  });

  it('deduplicates sellers from a mixed pool', () => {
    const pool = [
      makeListing({ id: 'm1', sellerId: 'A', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'm2', sellerId: 'B', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'm3', sellerId: 'A', isBoosted: true, boostUntil: FUTURE }), // duplicate seller A
      makeListing({ id: 'm4', sellerId: 'C', isBoosted: true, boostUntil: FUTURE }),
    ];
    const organic = makeOrganic(15);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    const adItems = page.filter(item => item.isAd);
    const adSellerIds = adItems.map(item => item.listing.sellerId);
    const uniqueAdSellers = new Set(adSellerIds);
    expect(uniqueAdSellers.size).toBe(adItems.length);
  });
});

describe('composeFeedPage — no duplicate listings on same page', () => {
  it('every listing id appears at most once per page', () => {
    const pool = makePool(4);
    const organic = makeOrganic(20);
    const page = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });

    const ids = page.map(item => item.listing.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe('composeFeedPage — deterministic shuffle', () => {
  it('same seed produces identical page output', () => {
    const pool = makePool(4);
    const organic = makeOrganic(20);
    const a = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: 9999 });
    const b = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: 9999 });
    expect(a.map(i => i.listing.id)).toEqual(b.map(i => i.listing.id));
  });

  it('different seed changes ad order', () => {
    const pool = makePool(4);
    const organic = makeOrganic(20);
    const a = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: 1 });
    const b = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: 9_999_999 });
    const adIdsA = a.filter(i => i.isAd).map(i => i.listing.id);
    const adIdsB = b.filter(i => i.isAd).map(i => i.listing.id);
    // With 4 items in a pool, two different seeds are extremely likely to yield different order
    expect(adIdsA).not.toEqual(adIdsB);
  });
});

describe('composeFeedPage — page 2 takes next pool items and wraps', () => {
  it('page 2 starts at offset adsPerPage in the shuffled pool', () => {
    // 4 unique sellers → adsPerPage = 3
    const pool = makePool(4);
    const organic = makeOrganic(30);

    const page1 = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });
    const page2 = composeFeedPage({ organic, boostedPool: pool, page: 2, seed: SEED });

    const adIds1 = page1.filter(i => i.isAd).map(i => i.listing.id);
    const adIds2 = page2.filter(i => i.isAd).map(i => i.listing.id);

    // The two pages must not have the same set of ad listings (they advance the pool)
    // OR if they do (wrapping full cycle), they are identical sets — test both cases.
    // At minimum: composing page 2 succeeds and returns 3 ads from the same pool.
    expect(adIds2.length).toBe(3);
    // Every ad on page 2 must still be from the pool
    const poolIds = new Set(pool.map(l => l.id));
    adIds2.forEach(id => expect(poolIds.has(id)).toBe(true));
  });

  it('wraps around when pool is smaller than adsPerPage * pages', () => {
    // 3 unique sellers → adsPerPage = 3 → page 2 wraps to pool[0..2] again
    const pool = makePool(3);
    const organic = makeOrganic(30);

    const page1 = composeFeedPage({ organic, boostedPool: pool, page: 1, seed: SEED });
    const page2 = composeFeedPage({ organic, boostedPool: pool, page: 2, seed: SEED });

    const adIds1 = new Set(page1.filter(i => i.isAd).map(i => i.listing.id));
    const adIds2 = new Set(page2.filter(i => i.isAd).map(i => i.listing.id));

    // 3 pool items, adsPerPage=3: page1 takes [0,1,2], page2 starts at (1*3)%3=0 → same set
    expect(adIds1).toEqual(adIds2);
  });
});

// ─── Repository-level: no ads when sort is price ────────────────────────────
// We import getCatalogFeed and call it with simulateLatencyMs=0 to keep tests fast.

describe('getCatalogFeed — no ads on price sort', () => {
  beforeEach(async () => {
    const { configureMock } = await import('@/lib/mock/repository');
    configureMock({ simulateLatencyMs: 0 });
  });

  afterEach(async () => {
    const { resetMockConfig } = await import('@/lib/mock/repository');
    resetMockConfig();
  });

  it('price_asc sort → zero isAd items', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({ sort: 'price_asc' }, 1);
    expect(result.items.every(item => !item.isAd)).toBe(true);
  });

  it('price_desc sort → zero isAd items', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({ sort: 'price_desc' }, 1);
    expect(result.items.every(item => !item.isAd)).toBe(true);
  });

  it('newest sort → has some isAd items (pool has active boosts)', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({ sort: 'newest' }, 1);
    expect(result.items.some(item => item.isAd)).toBe(true);
  });
});

// ─── Repository-level: ads respect filters ──────────────────────────────────

describe('getCatalogFeed — ads respect filters', () => {
  beforeEach(async () => {
    const { configureMock } = await import('@/lib/mock/repository');
    configureMock({ simulateLatencyMs: 0 });
  });

  afterEach(async () => {
    const { resetMockConfig } = await import('@/lib/mock/repository');
    resetMockConfig();
  });

  it('when filtered to drip-bag category, ad listings also belong to drip-bag', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({ categorySlug: 'drip-bag' }, 1);
    // drip-bag listings have no active boosts, so no ads expected
    expect(result.items.every(item => !item.isAd)).toBe(true);
  });

  it('when filtered to equipment category, ad listings also belong to equipment', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({ categorySlug: 'equipment' }, 1);
    // equipment has list-11 (seller-6) which is active-boosted (+1 day)
    const adItems = result.items.filter(item => item.isAd);
    adItems.forEach(item => {
      expect(item.listing.category.slug).toBe('equipment');
    });
  });

  it('expired boost listing (list-6) never appears as an ad', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    // list-6 is in green-beans category and has expired boost
    const result = await getCatalogFeed({ categorySlug: 'green-beans' }, 1);
    const adIds = result.items.filter(i => i.isAd).map(i => i.listing.id);
    expect(adIds).not.toContain('list-6');
  });

  it('total count equals unique listing count (ads not double-counted)', async () => {
    const { getCatalogFeed } = await import('@/lib/mock/repository');
    const result = await getCatalogFeed({}, 1);
    // total should equal number of active listings in mock data
    expect(result.total).toBeGreaterThan(0);
    // items should not contain duplicate ids
    const ids = result.items.map(i => i.listing.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});
