import {
  Category,
  ListingWithRelations,
  SellerWithRelations,
  ListingFilters,
  ListingFeedResult,
  ListingFilterOptions,
  CatalogFeedResult,
  FeedItem,
  SellerStats,
  AdminStats,
  Inquiry,
  ListingPerformance,
  SellerProfile,
  Payment,
  Subscription,
} from "@/types";
import {
  mockCategories,
  mockListings,
  mockSellers,
  mockSubscriptions,
  mockPayments,
  mockInquiries,
} from "./data";
import { composeFeedPage, isActiveBoost } from "@/lib/boost";
import { getEventSeries } from "./analytics-store";
import { ListingFormValues } from "../validations/listing.schema";
import { uniqueSlug } from "../slug";
import { SellerProfileFormValues } from "../validations/seller-profile.schema";
import { PlanState, resolvePlanState } from "../subscription";
import { PlanTier } from "../plans";

// Simulation Configuration for Testing States (Empty & Error)
export interface MockSimulationConfig {
  simulateLatencyMs: number;
  shouldFail: boolean;
  errorMessage: string;
  forceEmptyListings: boolean;
}

const qaState = process.env.MOCK_STATE;

const mockConfig: MockSimulationConfig = {
  simulateLatencyMs: qaState === "slow" ? 2000 : 200,
  shouldFail: qaState === "error",
  errorMessage: "Gagal memuat data dari mock repository. Silakan coba lagi.",
  forceEmptyListings: qaState === "empty",
};

export function configureMock(newConfig: Partial<MockSimulationConfig>) {
  Object.assign(mockConfig, newConfig);
}

export function resetMockConfig() {
  mockConfig.simulateLatencyMs = 200;
  mockConfig.shouldFail = false;
  mockConfig.errorMessage =
    "Gagal memuat data dari mock repository. Silakan coba lagi.";
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
export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  await simulateDelay();
  return mockCategories.find((c) => c.slug === slug) ?? null;
}

/**
 * Fetch listings with optional filtering and sorting
 */
async function findListings(
  filters: ListingFilters = {},
): Promise<ListingWithRelations[]> {
  await simulateDelay();

  if (mockConfig.forceEmptyListings) {
    return [];
  }

  let results = mockListings.filter((item) => item.status === "active");

  // Category filter
  if (filters.categorySlug && filters.categorySlug !== "all") {
    results = results.filter(
      (item) => item.category.slug === filters.categorySlug,
    );
  }

  // Origin region filter
  if (filters.originRegion && filters.originRegion !== "all") {
    results = results.filter(
      (item) => item.tasteProfile?.originRegion === filters.originRegion,
    );
  }

  // Process method filter
  if (filters.processMethod && filters.processMethod !== "all") {
    results = results.filter(
      (item) => item.tasteProfile?.processMethod === filters.processMethod,
    );
  }

  // Roast level filter
  if (filters.roastLevel && filters.roastLevel !== "all") {
    results = results.filter(
      (item) => item.tasteProfile?.roastLevel === filters.roastLevel,
    );
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
  if (typeof filters.minPrice === "number" && !isNaN(filters.minPrice)) {
    results = results.filter((item) => item.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number" && !isNaN(filters.maxPrice)) {
    results = results.filter((item) => item.price <= filters.maxPrice!);
  }

  // Keyword search (title, seller name, origin, flavor notes)
  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.toLowerCase().trim();
    results = results.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSeller = item.seller.businessName.toLowerCase().includes(q);
      const matchOrigin =
        item.tasteProfile?.originRegion.toLowerCase().includes(q) ?? false;
      const matchNotes =
        item.tasteProfile?.flavorNotes.toLowerCase().includes(q) ?? false;
      return matchTitle || matchSeller || matchOrigin || matchNotes;
    });
  }

  // Sort by requested criteria only — boost placement is handled by getCatalogFeed.
  results.sort((a, b) => {
    if (filters.sort === "price_asc") return a.price - b.price;
    if (filters.sort === "price_desc") return b.price - a.price;
    if (filters.sort === "popular") return a.minOrderQty - b.minOrderQty;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return results;
}

export async function getListings(
  filters: ListingFilters & { page?: number; pageSize?: number } = {},
): Promise<ListingFeedResult> {
  const results = await findListings(filters);
  const pageSize = Math.max(1, filters.pageSize ?? Number.MAX_SAFE_INTEGER);
  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * pageSize;
  return {
    items: results.slice(start, start + pageSize),
    total: results.length,
  };
}

export async function getListingFeed(
  filters: ListingFilters & { page?: number; pageSize?: number } = {},
): Promise<ListingFeedResult> {
  return getListings(filters);
}

/**
 * Builds the public catalog feed for pages 1..upToPage using the boost placement
 * algorithm (ad slots at indexes 0, 5, 10; seed = current hour; no ads on price sort).
 */
export async function getCatalogFeed(
  filters: ListingFilters,
  upToPage: number,
): Promise<CatalogFeedResult> {
  const allFiltered = await findListings(filters);
  const isPriceSort =
    filters.sort === "price_asc" || filters.sort === "price_desc";
  const now = Date.now();
  const seed = Math.floor(now / 3_600_000);

  const items: FeedItem[] = [];
  for (let page = 1; page <= upToPage; page++) {
    const pageItems = composeFeedPage({
      allFiltered,
      isPriceSort,
      page,
      pageSize: 12,
      adSlotIndexes: [0, 5, 10],
      seed,
    });
    if (pageItems.length === 0) break;
    items.push(...pageItems);
  }

  const total = allFiltered.length;
  const hasMore = upToPage * 12 < total;

  return { items, total, hasMore };
}

export async function getFilterOptions(): Promise<ListingFilterOptions> {
  await simulateDelay();
  return {
    origins: [
      ...new Set(
        mockListings
          .map((listing) => listing.tasteProfile?.originRegion)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
    processes: [
      ...new Set(
        mockListings
          .map((listing) => listing.tasteProfile?.processMethod)
          .filter((value): value is NonNullable<typeof value> =>
            Boolean(value),
          ),
      ),
    ].sort(),
    roastLevels: [
      ...new Set(
        mockListings
          .map((listing) => listing.tasteProfile?.roastLevel)
          .filter((value): value is NonNullable<typeof value> =>
            Boolean(value),
          ),
      ),
    ].sort(),
  };
}

/**
 * Fetch a single listing by its slug
 */
export async function getListingBySlug(
  slug: string,
): Promise<ListingWithRelations | null> {
  await simulateDelay();
  const listing = mockListings.find((item) => item.slug === slug);
  return listing ? { ...listing } : null;
}

/**
 * Fetch a single listing by its ID
 */
export async function getListingById(
  id: string,
): Promise<ListingWithRelations | null> {
  await simulateDelay();
  const listing = mockListings.find((item) => item.id === id);
  return listing ? { ...listing } : null;
}

/**
 * Fetch a seller profile with associated listings and relations
 */
export async function getSellerBySlug(
  slug: string,
): Promise<SellerWithRelations | null> {
  await simulateDelay();
  const seller = mockSellers.find((s) => s.slug === slug);
  if (!seller) return null;

  const listings = mockConfig.forceEmptyListings
    ? []
    : mockListings.filter((l) => l.sellerId === seller.id);
  const subscriptions = mockSubscriptions.filter(
    (sub) => sub.sellerId === seller.id,
  );
  const payments = mockConfig.forceEmptyListings
    ? []
    : mockPayments.filter((p) => p.sellerId === seller.id);

  return {
    ...seller,
    listings,
    subscriptions,
    tier: resolvePlanState(subscriptions).tier,
    payments,
  };
}

/**
 * Fetch seller profile by sellerId
 */
export async function getSellerById(
  id: string,
): Promise<SellerWithRelations | null> {
  await simulateDelay();
  const seller = mockSellers.find((s) => s.id === id);
  if (!seller) return null;

  const listings = mockConfig.forceEmptyListings
    ? []
    : mockListings.filter((l) => l.sellerId === seller.id);
  const subscriptions = mockSubscriptions.filter(
    (sub) => sub.sellerId === seller.id,
  );
  const payments = mockConfig.forceEmptyListings
    ? []
    : mockPayments.filter((p) => p.sellerId === seller.id);

  return {
    ...seller,
    listings,
    subscriptions,
    tier: resolvePlanState(subscriptions).tier,
    payments,
  };
}

/**
 * Fetch analytics metrics and overview for seller dashboard
 */
export const STATS_WINDOW_DAYS = 30;

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  await simulateDelay();

  const sellerListings = mockConfig.forceEmptyListings
    ? []
    : mockListings.filter((l) => l.sellerId === sellerId);
  const listingIds = new Set(sellerListings.map((l) => l.id));
  const inquiries = mockInquiries.filter((inq) =>
    listingIds.has(inq.listingId),
  );

  const series = getEventSeries([...listingIds], STATS_WINDOW_DAYS);
  const totalViews = series.reduce((sum, p) => sum + p.views, 0);
  const totalClicks = series.reduce((sum, p) => sum + p.clicks, 0);
  const totalImpressions = series.reduce((sum, p) => sum + p.impressions, 0);
  const hasEvents = totalViews + totalClicks + totalImpressions > 0;

  return {
    totalViews,
    totalClicks,
    totalImpressions,
    conversionRate:
      totalViews > 0
        ? Number(((totalClicks / totalViews) * 100).toFixed(1))
        : 0,
    totalListings: sellerListings.length,
    activeListings: sellerListings.filter((l) => l.status === "active").length,
    inquiryCount: inquiries.length,
    metrics: hasEvents
      ? series.map(({ date, views, clicks }) => ({ date, views, clicks }))
      : [],
  };
}

export async function getSellerListingPerformance(
  sellerId: string,
): Promise<ListingPerformance[]> {
  await simulateDelay();

  if (mockConfig.forceEmptyListings) return [];

  const now = Date.now();
  return mockListings
    .filter((l) => l.sellerId === sellerId)
    .map((l) => {
      const series = getEventSeries([l.id], STATS_WINDOW_DAYS, now);
      const views = series.reduce((sum, p) => sum + p.views, 0);
      const clicks = series.reduce((sum, p) => sum + p.clicks, 0);
      const impressions = series.reduce((sum, p) => sum + p.impressions, 0);
      return {
        listingId: l.id,
        title: l.title,
        slug: l.slug,
        views,
        clicks,
        impressions,
        conversionRate:
          views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0,
        boostUntil: isActiveBoost(l, now) ? (l.boostUntil ?? null) : null,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views);
}

/**
 * Fetch admin platform overview stats
 */
export async function getAdminStats(): Promise<AdminStats> {
  await simulateDelay();

  const empty = mockConfig.forceEmptyListings;
  const payments = empty ? [] : mockPayments;
  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalSellers: mockSellers.length,
    totalListings: empty ? 0 : mockListings.length,
    pendingVerifications: empty
      ? 0
      : mockSellers.filter(
          (s) => !s.isVerified && !rejectedVerificationIds.has(s.id),
        ).length,
    monthlyRevenue: totalRevenue,
    recentPayments: [...payments],
  };
}

/**
 * Fetch inquiries for a seller
 */
export async function getInquiries(sellerId?: string): Promise<Inquiry[]> {
  await simulateDelay();

  if (mockConfig.forceEmptyListings) return [];

  if (!sellerId) {
    return [...mockInquiries];
  }

  const sellerListingIds = new Set(
    mockListings.filter((l) => l.sellerId === sellerId).map((l) => l.id),
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

const rejectedVerificationIds = new Set<string>();

export async function getSellers(): Promise<SellerProfile[]> {
  await simulateDelay();
  return [...mockSellers];
}

export async function getPendingVerifications(): Promise<SellerProfile[]> {
  await simulateDelay();
  if (mockConfig.forceEmptyListings) return [];
  return mockSellers.filter(
    (s) => !s.isVerified && !rejectedVerificationIds.has(s.id),
  );
}

export async function getAdminListings(): Promise<ListingWithRelations[]> {
  await simulateDelay();
  if (mockConfig.forceEmptyListings) return [];
  return [...mockListings];
}

export async function reviewVerification(
  sellerId: string,
  decision: "approve" | "reject",
): Promise<boolean> {
  await simulateDelay(200);
  const seller = mockSellers.find((s) => s.id === sellerId);
  if (!seller) return false;
  if (decision === "approve") {
    seller.isVerified = true;
    rejectedVerificationIds.delete(sellerId);
  } else {
    rejectedVerificationIds.add(sellerId);
  }
  return true;
}

export async function moderateListing(
  listingId: string,
  decision: "approve" | "suspend",
): Promise<boolean> {
  await simulateDelay(200);
  const listing = mockListings.find((l) => l.id === listingId);
  if (!listing) return false;
  listing.status = decision === "approve" ? "active" : "suspended";
  return true;
}

export async function updateSellerProfile(
  sellerId: string,
  data: SellerProfileFormValues,
): Promise<SellerProfile | null> {
  await simulateDelay(300);
  const seller = mockSellers.find((s) => s.id === sellerId);
  if (!seller) return null;
  Object.assign(seller, { ...data, bio: data.bio ?? seller.bio });
  return seller;
}

function toImages(listingId: string, data: ListingFormValues) {
  return data.images.map((image, index) => ({
    id: `img-${listingId}-${index}`,
    listingId,
    url: image.url,
    sortOrder: index,
  }));
}

function toTasteProfile(
  listingId: string,
  data: ListingFormValues,
  id: string,
) {
  return {
    id,
    listingId,
    originRegion: data.originRegion,
    processMethod: data.processMethod,
    roastLevel: data.roastLevel,
    flavorNotes: data.flavorNotes,
    acidityScore: data.acidityScore,
    bodyScore: data.bodyScore,
    sweetnessScore: data.sweetnessScore,
    aromaScore: data.aromaScore,
    aftertasteScore: data.aftertasteScore,
    roastDate: new Date(data.roastDate).toISOString(),
  };
}

export async function createListing(
  sellerId: string,
  data: ListingFormValues,
): Promise<ListingWithRelations | null> {
  await simulateDelay(300);
  const seller = mockSellers.find((s) => s.id === sellerId);
  const category = mockCategories.find((c) => c.id === data.categoryId);
  if (!seller || !category) return null;

  const id = `list-${Date.now()}`;
  const listing: ListingWithRelations = {
    id,
    slug: uniqueSlug(data.title, new Set(mockListings.map((l) => l.slug))),
    sellerId,
    categoryId: category.id,
    title: data.title,
    description: data.description,
    price: data.price,
    unit: data.unit,
    minOrderQty: data.minOrderQty,
    status: data.status,
    isBoosted: false,
    boostUntil: null,
    createdAt: new Date().toISOString(),
    seller,
    category,
    images: toImages(id, data),
    tasteProfile: toTasteProfile(id, data, `taste-${id}`),
  };
  mockListings.unshift(listing);
  return listing;
}

/** Returns null when the listing does not exist or belongs to another seller. */
export async function updateListing(
  sellerId: string,
  listingId: string,
  data: ListingFormValues,
): Promise<ListingWithRelations | null> {
  await simulateDelay(300);
  const listing = mockListings.find((l) => l.id === listingId);
  const category = mockCategories.find((c) => c.id === data.categoryId);
  if (!listing || listing.sellerId !== sellerId || !category) return null;

  Object.assign(listing, {
    title: data.title,
    description: data.description,
    price: data.price,
    unit: data.unit,
    minOrderQty: data.minOrderQty,
    categoryId: category.id,
    category,
    images: toImages(listing.id, data),
    status: listing.status === "suspended" ? "suspended" : data.status,
    tasteProfile: toTasteProfile(
      listing.id,
      data,
      listing.tasteProfile?.id ?? `taste-${listing.id}`,
    ),
  });
  return listing;
}

export async function activateBoost(
  sellerId: string,
  listingId: string,
  days: number,
  amount: number,
): Promise<Payment | null> {
  await simulateDelay(300);
  const listing = mockListings.find((l) => l.id === listingId);
  if (!listing || listing.sellerId !== sellerId) return null;

  const now = Date.now();
  listing.isBoosted = true;
  listing.boostUntil = new Date(now + days * 86_400_000).toISOString();

  const payment: Payment = {
    id: `pay-${now}`,
    sellerId,
    listingId,
    type: "boost",
    amount,
    status: "paid",
    midtransOrderId: `${amount === 0 ? "CREDIT" : "MOCK"}-BOOST-${now}`,
    paidAt: new Date(now).toISOString(),
    createdAt: new Date(now).toISOString(),
  };
  mockPayments.unshift(payment);
  return payment;
}

export async function getSellerPlanState(sellerId: string): Promise<PlanState> {
  await simulateDelay();
  return resolvePlanState(
    mockSubscriptions.filter((sub) => sub.sellerId === sellerId),
  );
}

export async function getSellerPayments(sellerId: string): Promise<Payment[]> {
  await simulateDelay();
  if (mockConfig.forceEmptyListings) return [];
  return mockPayments.filter((p) => p.sellerId === sellerId);
}

export async function startSubscription(input: {
  sellerId: string;
  tier: Exclude<PlanTier, "free">;
  kind: "new" | "renew" | "upgrade";
  expiresAt: string;
  amount: number;
}): Promise<{ subscription: Subscription; payment: Payment } | null> {
  await simulateDelay(300);
  const seller = mockSellers.find((s) => s.id === input.sellerId);
  if (!seller) return null;

  const now = Date.now();
  const mine = mockSubscriptions.filter(
    (sub) => sub.sellerId === input.sellerId,
  );
  let subscription: Subscription;

  if (input.kind === "renew") {
    const current = resolvePlanState(mine, now).subscription;
    if (!current || current.tier !== input.tier) return null;
    current.expiresAt = input.expiresAt;
    current.cancelAtPeriodEnd = false;
    subscription = current;
  } else {
    mine
      .filter((sub) => sub.status === "active")
      .forEach((sub) => (sub.status = "canceled"));
    subscription = {
      id: `sub-${now}`,
      sellerId: input.sellerId,
      tier: input.tier,
      status: "active",
      startedAt: new Date(now).toISOString(),
      expiresAt: input.expiresAt,
    };
    mockSubscriptions.push(subscription);
  }
  seller.tier = input.tier;

  const payment: Payment = {
    id: `pay-${now}`,
    sellerId: input.sellerId,
    subscriptionId: subscription.id,
    type: "subscription",
    amount: input.amount,
    status: "paid",
    midtransOrderId: `MOCK-SUB-${now}`,
    paidAt: new Date(now).toISOString(),
    createdAt: new Date(now).toISOString(),
  };
  mockPayments.unshift(payment);
  return { subscription, payment };
}

export async function setCancelAtPeriodEnd(
  sellerId: string,
  value: boolean,
): Promise<boolean> {
  await simulateDelay(200);
  const current = resolvePlanState(
    mockSubscriptions.filter((sub) => sub.sellerId === sellerId),
  ).subscription;
  if (!current) return false;
  current.cancelAtPeriodEnd = value;
  return true;
}
