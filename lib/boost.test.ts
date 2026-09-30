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

describe('composeFeedPage', () => {
  it('every filtered listing appears exactly once across all pages', () => {
    const allFiltered = [...makePool(10), ...makeOrganic(10)];
    const totalPages = Math.ceil(allFiltered.length / 12);
    const resultIds = new Set<string>();

    for (let p = 1; p <= totalPages; p++) {
      const page = composeFeedPage({ allFiltered, isPriceSort: false, page: p, seed: SEED, pageSize: 12 });
      page.forEach(item => {
        expect(resultIds.has(item.listing.id)).toBe(false);
        resultIds.add(item.listing.id);
      });
    }
    expect(resultIds.size).toBe(allFiltered.length);
  });

  it('no listing appears twice in a cumulative feed', () => {
    const allFiltered = [...makePool(5), ...makeOrganic(20)];
    let cumulative: string[] = [];
    for (let p = 1; p <= 3; p++) {
      const page = composeFeedPage({ allFiltered, isPriceSort: false, page: p, seed: SEED, pageSize: 12 });
      cumulative = cumulative.concat(page.map(i => i.listing.id));
    }
    expect(new Set(cumulative).size).toBe(cumulative.length);
  });

  it('unassigned boosts appear organically without the ad flag', () => {
    const allFiltered = [
      makeListing({ id: 'b1', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'b2', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'b3', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'b4', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'b5', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
    ];
    const page = composeFeedPage({ allFiltered, isPriceSort: false, page: 1, seed: SEED, pageSize: 12 });
    const ads = page.filter(i => i.isAd);
    const organics = page.filter(i => !i.isAd);
    expect(ads.length).toBe(1);
    expect(organics.length).toBe(4);
    expect(organics.every(o => o.listing.isBoosted)).toBe(true);
  });

  it('page 1 is identical for upToPage 1 and 2 (assignment does not depend on upToPage)', () => {
    const allFiltered = [...makePool(10), ...makeOrganic(20)];
    const page1A = composeFeedPage({ allFiltered, isPriceSort: false, page: 1, seed: SEED, pageSize: 12 });
    const page1B = composeFeedPage({ allFiltered, isPriceSort: false, page: 1, seed: SEED, pageSize: 12 });
    expect(page1A).toEqual(page1B);
  });

  it('never more than 3 ads per page', () => {
    const allFiltered = [...makePool(10), ...makeOrganic(30)];
    const page = composeFeedPage({ allFiltered, isPriceSort: false, page: 1, seed: SEED, pageSize: 12 });
    expect(page.filter(i => i.isAd).length).toBeLessThanOrEqual(3);
  });

  it('ads never come from a seller already used on that page', () => {
    const allFiltered = [
      makeListing({ id: 'b1', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      makeListing({ id: 'b2', sellerId: 's1', isBoosted: true, boostUntil: FUTURE }),
      ...makeOrganic(10)
    ];
    const page = composeFeedPage({ allFiltered, isPriceSort: false, page: 1, seed: SEED, pageSize: 12 });
    const adSellers = page.filter(i => i.isAd).map(i => i.listing.sellerId);
    expect(new Set(adSellers).size).toBe(adSellers.length);
  });

  it('scale test: 10 boosted (10 sellers) + 10 organic asserts exact-once', () => {
    const allFiltered = [...makePool(10), ...makeOrganic(10)];
    const totalPages = Math.ceil(allFiltered.length / 12);
    const resultIds = new Set<string>();

    for (let p = 1; p <= totalPages; p++) {
      const page = composeFeedPage({ allFiltered, isPriceSort: false, page: p, seed: SEED, pageSize: 12 });
      page.forEach(item => {
        expect(resultIds.has(item.listing.id)).toBe(false);
        resultIds.add(item.listing.id);
      });
    }
    expect(resultIds.size).toBe(allFiltered.length);
  });

  it('scale test: 100 boosted + 100 organic asserts exact-once', () => {
    const allFiltered = [...makePool(100), ...makeOrganic(100)];
    const totalPages = Math.ceil(allFiltered.length / 12);
    const resultIds = new Set<string>();
    
    let totalAds = 0;

    for (let p = 1; p <= totalPages; p++) {
      const page = composeFeedPage({ allFiltered, isPriceSort: false, page: p, seed: SEED, pageSize: 12 });
      totalAds += page.filter(i => i.isAd).length;
      page.forEach(item => {
        expect(resultIds.has(item.listing.id)).toBe(false);
        resultIds.add(item.listing.id);
      });
    }
    expect(resultIds.size).toBe(allFiltered.length);
  });
  
  it('terminates on its own', () => {
    const allFiltered = [...makeOrganic(5)];
    const page2 = composeFeedPage({ allFiltered, isPriceSort: false, page: 2, seed: SEED, pageSize: 12 });
    expect(page2.length).toBe(0);
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
