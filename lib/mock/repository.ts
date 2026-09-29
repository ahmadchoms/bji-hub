import {
  Category,
  ListingWithRelations,
  SellerWithRelations,
  ListingFilters,
  ListingFeedResult,
  ListingFilterOptions,
  SellerStats,
  AdminStats,
  Inquiry,
} from '@/types';
import {
  mockCategories,
  mockListings,
  mockSellers,
  mockSubscriptions,
  mockPayments,
  mockInquiries,
} from './data';

// Simulation Configuration for Testing States (Empty & Error)
export interface MockSimulationConfig {
  simulateLatencyMs: number;
  shouldFail: boolean;
  errorMessage: string;
  forceEmptyListings: boolean;
}

const mockConfig: MockSimulationConfig = {
  simulateLatencyMs: 200,
  shouldFail: false,
  errorMessage: 'Gagal memuat data dari mock repository. Silakan coba lagi.',
  forceEmptyListings: false,
};

export function configureMock(newConfig: Partial<MockSimulationConfig>) {
  Object.assign(mockConfig, newConfig);
}

export function resetMockConfig() {
  mockConfig.simulateLatencyMs = 200;
  mockConfig.shouldFail = false;
  mockConfig.errorMessage = 'Gagal memuat data dari mock repository. Silakan coba lagi.';
  mockConfig.forceEmptyListings = false;
}

async function simulateDelay(ms = mockConfig.simulateLatencyMs): Promise<void> {
  if (ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  if (mockConfig.shouldFail) {
    throw new Error(mockConfig.errorMessage);
  }
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
  await simulateDelay();
  return [...mockCategories];
}

/**
 * Fetch category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  await simulateDelay();
  return mockCategories.find((c) => c.slug === slug) ?? null;
}

/**
 * Fetch listings with optional filtering and sorting
 */
async function findListings(filters: ListingFilters = {}): Promise<ListingWithRelations[]> {
  await simulateDelay();

  if (mockConfig.forceEmptyListings) {
    return [];
  }

  let results = mockListings.filter((item) => item.status === 'active');

  // Category filter
  if (filters.categorySlug && filters.categorySlug !== 'all') {
    results = results.filter((item) => item.category.slug === filters.categorySlug);
  }

  // Origin region filter
  if (filters.originRegion && filters.originRegion !== 'all') {
    results = results.filter((item) => item.tasteProfile?.originRegion === filters.originRegion);
  }

  // Process method filter
  if (filters.processMethod && filters.processMethod !== 'all') {
    results = results.filter((item) => item.tasteProfile?.processMethod === filters.processMethod);
  }

  // Roast level filter
  if (filters.roastLevel && filters.roastLevel !== 'all') {
    results = results.filter((item) => item.tasteProfile?.roastLevel === filters.roastLevel);
  }

  // Verified seller only filter
  if (filters.isVerified) {
    results = results.filter((item) => item.seller.isVerified);
  }

  // Boosted listing filter
  if (filters.isBoosted) {
    results = results.filter((item) => item.isBoosted);
  }

  // Price range filters
  if (typeof filters.minPrice === 'number' && !isNaN(filters.minPrice)) {
    results = results.filter((item) => item.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === 'number' && !isNaN(filters.maxPrice)) {
    results = results.filter((item) => item.price <= filters.maxPrice!);
  }

  // Keyword search (title, seller name, origin, flavor notes)
  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase().trim();
    results = results.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSeller = item.seller.businessName.toLowerCase().includes(q);
      const matchOrigin = item.tasteProfile?.originRegion.toLowerCase().includes(q) ?? false;
      const matchNotes = item.tasteProfile?.flavorNotes.toLowerCase().includes(q) ?? false;
      return matchTitle || matchSeller || matchOrigin || matchNotes;
    });
  }

  // Valid boosted listings lead every ordering, then requested sort.
  const isActiveBoost = (listing: ListingWithRelations) =>
    listing.isBoosted && Boolean(listing.boostUntil) && new Date(listing.boostUntil || 0).getTime() > Date.now();

  results.sort((a, b) => {
    if (isActiveBoost(a) !== isActiveBoost(b)) {
      return isActiveBoost(a) ? -1 : 1;
    }
    if (filters.sort === 'price_asc') return a.price - b.price;
    if (filters.sort === 'price_desc') return b.price - a.price;
    if (filters.sort === 'popular') return a.minOrderQty - b.minOrderQty;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return results;
}

export async function getListings(filters: ListingFilters & { page?: number; pageSize?: number } = {}): Promise<ListingFeedResult> {
  const results = await findListings(filters);
  const pageSize = Math.max(1, filters.pageSize ?? Number.MAX_SAFE_INTEGER);
  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * pageSize;
  return { items: results.slice(start, start + pageSize), total: results.length };
}

export async function getListingFeed(filters: ListingFilters & { page?: number; pageSize?: number } = {}): Promise<ListingFeedResult> {
  return getListings(filters);
}

export async function getFilterOptions(): Promise<ListingFilterOptions> {
  await simulateDelay();
  return {
    origins: [...new Set(mockListings.map((listing) => listing.tasteProfile?.originRegion).filter((value): value is string => Boolean(value)))].sort(),
    processes: [...new Set(mockListings.map((listing) => listing.tasteProfile?.processMethod).filter((value): value is NonNullable<typeof value> => Boolean(value)))].sort(),
    roastLevels: [...new Set(mockListings.map((listing) => listing.tasteProfile?.roastLevel).filter((value): value is NonNullable<typeof value> => Boolean(value)))].sort(),
  };
}

/**
 * Fetch a single listing by its slug
 */
export async function getListingBySlug(slug: string): Promise<ListingWithRelations | null> {
  await simulateDelay();
  const listing = mockListings.find((item) => item.slug === slug);
  return listing ? { ...listing } : null;
}

/**
 * Fetch a single listing by its ID
 */
export async function getListingById(id: string): Promise<ListingWithRelations | null> {
  await simulateDelay();
  const listing = mockListings.find((item) => item.id === id);
  return listing ? { ...listing } : null;
}

/**
 * Fetch a seller profile with associated listings and relations
 */
export async function getSellerBySlug(slug: string): Promise<SellerWithRelations | null> {
  await simulateDelay();
  const seller = mockSellers.find((s) => s.slug === slug);
  if (!seller) return null;

  const listings = mockListings.filter((l) => l.sellerId === seller.id);
  const subscriptions = mockSubscriptions.filter((sub) => sub.sellerId === seller.id);
  const payments = mockPayments.filter((p) => p.sellerId === seller.id);

  return {
    ...seller,
    listings,
    subscriptions,
    payments,
  };
}

/**
 * Fetch seller profile by sellerId
 */
export async function getSellerById(id: string): Promise<SellerWithRelations | null> {
  await simulateDelay();
  const seller = mockSellers.find((s) => s.id === id);
  if (!seller) return null;

  const listings = mockListings.filter((l) => l.sellerId === seller.id);
  const subscriptions = mockSubscriptions.filter((sub) => sub.sellerId === seller.id);
  const payments = mockPayments.filter((p) => p.sellerId === seller.id);

  return {
    ...seller,
    listings,
    subscriptions,
    payments,
  };
}

/**
 * Fetch analytics metrics and overview for seller dashboard
 */
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  await simulateDelay();

  const sellerListings = mockListings.filter((l) => l.sellerId === sellerId);
  const listingIds = new Set(sellerListings.map((l) => l.id));
  const inquiries = mockInquiries.filter((inq) => listingIds.has(inq.listingId));

  // Generate realistic daily metrics for past 14 days
  const metrics = [
    { date: '15 Feb', views: 42, clicks: 5 },
    { date: '16 Feb', views: 56, clicks: 7 },
    { date: '17 Feb', views: 48, clicks: 4 },
    { date: '18 Feb', views: 72, clicks: 9 },
    { date: '19 Feb', views: 65, clicks: 8 },
    { date: '20 Feb', views: 89, clicks: 12 },
    { date: '21 Feb', views: 95, clicks: 14 },
    { date: '22 Feb', views: 110, clicks: 16 },
    { date: '23 Feb', views: 85, clicks: 11 },
    { date: '24 Feb', views: 102, clicks: 15 },
    { date: '25 Feb', views: 120, clicks: 18 },
    { date: '26 Feb', views: 135, clicks: 21 },
    { date: '27 Feb', views: 140, clicks: 22 },
    { date: '28 Feb', views: 158, clicks: 25 },
  ];

  const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const conversionRate = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  return {
    totalViews,
    totalClicks,
    conversionRate,
    totalListings: sellerListings.length,
    activeListings: sellerListings.filter((l) => l.status === 'active').length,
    inquiryCount: inquiries.length,
    metrics,
  };
}

/**
 * Fetch admin platform overview stats
 */
export async function getAdminStats(): Promise<AdminStats> {
  await simulateDelay();

  const monthlyRevenue = mockPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalSellers: mockSellers.length,
    totalListings: mockListings.length,
    pendingVerifications: mockSellers.filter((s) => !s.isVerified).length,
    monthlyRevenue,
    recentPayments: [...mockPayments],
  };
}

/**
 * Fetch inquiries for a seller
 */
export async function getInquiries(sellerId?: string): Promise<Inquiry[]> {
  await simulateDelay();

  if (!sellerId) {
    return [...mockInquiries];
  }

  const sellerListingIds = new Set(
    mockListings.filter((l) => l.sellerId === sellerId).map((l) => l.id)
  );

  return mockInquiries.filter((inq) => sellerListingIds.has(inq.listingId));
}

/**
 * Submit an inquiry
 */
export async function submitInquiry(input: {
  listingId: string;
  buyerName: string;
  buyerContact: string;
  quantity: string;
  message: string;
}): Promise<Inquiry> {
  await simulateDelay(300);

  const newInquiry: Inquiry = {
    id: `inq-${Date.now()}`,
    listingId: input.listingId,
    buyerName: input.buyerName,
    buyerContact: input.buyerContact,
    quantity: input.quantity,
    message: input.message,
    createdAt: new Date().toISOString(),
  };

  mockInquiries.unshift(newInquiry);
  return newInquiry;
}
