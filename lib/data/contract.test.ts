import { beforeAll, describe, expect, it } from "vitest";
import { isActiveBoost } from "@/lib/boost";
import type { DataRepository } from "@/lib/data/contract";
import { mockRepository } from "@/lib/data/mock";
import { mockListings } from "@/lib/mock/data";
import { configureMock } from "@/lib/mock/repository";
import { decidePlanChange } from "@/lib/subscription";
import type { ListingFormValues } from "@/lib/validations/listing.schema";

/**
 * One suite, two implementations. The Prisma run needs a throwaway database:
 *   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/biji_test npm run test
 * It is wiped and re-seeded, so its name must end with "_test".
 */
const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB && !/\/[^/?]*_test(\?|$)/.test(TEST_DB)) {
  throw new Error("TEST_DATABASE_URL must point to a database whose name ends with _test (it gets wiped).");
}

let prismaRepo: Promise<DataRepository> | null = null;
function loadPrisma(): Promise<DataRepository> {
  prismaRepo ??= (async () => {
    process.env.DATABASE_URL = TEST_DB;
    const [{ prismaRepository }, { getPrisma }, { seedDatabase }] = await Promise.all([
      import("@/lib/data/prisma"),
      import("@/lib/data/prisma/client"),
      import("../../prisma/seed-data"),
    ]);
    await seedDatabase(getPrisma());
    return prismaRepository;
  })();
  return prismaRepo;
}

configureMock({ simulateLatencyMs: 0 });
const targets = [
  { name: "mock", load: async () => mockRepository },
  ...(TEST_DB ? [{ name: "prisma", load: loadPrisma }] : []),
];

// Snapshot before any test mutates the mock (createListing adds to the front of the array).
const SEED_LISTINGS = [...mockListings];
const activeCount = SEED_LISTINGS.filter((l) => l.status === "active").length;
const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const sessionId = () => `session-${crypto.randomUUID()}`;

const form = (categoryId: string, over: Partial<ListingFormValues> = {}): ListingFormValues => ({
  title: "Kontrak Kopi Uji",
  categoryId,
  description: "Deskripsi produk uji yang cukup panjang untuk lolos validasi.",
  price: 91500,
  unit: "250g",
  minOrderQty: 2,
  status: "active",
  originRegion: "Gayo",
  processMethod: "Natural",
  roastLevel: "Medium",
  flavorNotes: "Cokelat, jeruk",
  acidityScore: 3.5,
  bodyScore: 4,
  roastDate: "2026-09-20",
  images: [
    { url: "/api/mock-storage/a", path: "p/a" },
    { url: "/api/mock-storage/b", path: "p/b" },
  ],
  ...over,
});

// ─── Parity: the database must answer exactly like the mock ────────────────
describe.skipIf(!TEST_DB)("parity: prisma answers like the mock", () => {
  let prisma: DataRepository;
  beforeAll(async () => {
    prisma = await loadPrisma();
  }, 60_000);

  const queries = [
    {},
    { categorySlug: "green-beans" },
    { originRegion: "Gayo" },
    { processMethod: "Natural" },
    { roastLevel: "Medium" },
    { isVerified: true },
    { isBoosted: true },
    { minPrice: 80000, maxPrice: 200000 },
    { search: "GAYO" },
    { search: "aceh" },
    { categorySlug: "roasted-beans", isVerified: true, sort: "price_asc" as const },
  ];

  it.each(queries)("getListings %j returns the same listings", async (filters) => {
    const [a, b] = await Promise.all([mockRepository.getListings(filters), prisma.getListings(filters)]);
    expect(b.total).toBe(a.total);
    expect(b.items.map((i) => i.id).sort()).toEqual(a.items.map((i) => i.id).sort());
  });

  it("maps a listing to the same shape and values", async () => {
    const [a, b] = await Promise.all([mockRepository.getListingBySlug(SEED_LISTINGS[0].slug), prisma.getListingBySlug(SEED_LISTINGS[0].slug)]);
    expect(b).toEqual(a);
  });

  it("returns the same filter options, categories, plans, and admin numbers", async () => {
    expect(await prisma.getFilterOptions()).toEqual(await mockRepository.getFilterOptions());
    expect((await prisma.getCategories()).map((c) => c.slug)).toEqual((await mockRepository.getCategories()).map((c) => c.slug));
    for (const id of ["seller-1", "seller-2", "seller-3", "seller-4", "seller-5", "seller-6"]) {
      expect((await prisma.getSellerPlanState(id)).tier).toBe((await mockRepository.getSellerPlanState(id)).tier);
    }
    const [a, b] = await Promise.all([mockRepository.getAdminStats(), prisma.getAdminStats()]);
    expect(b).toMatchObject({
      totalSellers: a.totalSellers,
      totalListings: a.totalListings,
      pendingVerifications: a.pendingVerifications,
      monthlyRevenue: a.monthlyRevenue,
    });
    expect(b.recentPayments.map((p) => p.id).sort()).toEqual(a.recentPayments.map((p) => p.id).sort());
  });

  it("returns the same seller profile, stats and inquiries", async () => {
    const [a, b] = await Promise.all([mockRepository.getSellerById("seller-1"), prisma.getSellerById("seller-1")]);
    expect(b?.listings.map((l) => l.id).sort()).toEqual(a?.listings.map((l) => l.id).sort());
    expect(b?.tier).toBe(a?.tier);
    const [sa, sb] = await Promise.all([mockRepository.getSellerStats("seller-1"), prisma.getSellerStats("seller-1")]);
    expect(sb).toMatchObject({ totalListings: sa.totalListings, activeListings: sa.activeListings, inquiryCount: sa.inquiryCount });
    expect(sb.metrics).toHaveLength(sa.metrics.length);
    expect(sb.totalViews).toBeGreaterThan(0);
    expect(Math.abs(sb.totalViews - sa.totalViews)).toBeLessThanOrEqual(Math.ceil(sa.totalViews * 0.05));
    expect((await prisma.getInquiries("seller-1")).map((i) => i.id).sort()).toEqual((await mockRepository.getInquiries("seller-1")).map((i) => i.id).sort());
  });
});

// ─── The contract itself, run against every implementation ──────────────────
describe.each(targets)("data layer contract: $name", ({ load }) => {
  let repo: DataRepository;
  let categoryId: string;

  beforeAll(async () => {
    repo = await load();
    categoryId = (await repo.getCategories())[0].id;
  }, 60_000);

  describe("catalog", () => {
    it("lists and finds categories", async () => {
      const categories = await repo.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(new Set(categories.map((c) => c.slug)).size).toBe(categories.length);
      expect((await repo.getCategoryBySlug(categories[0].slug))?.id).toBe(categories[0].id);
      expect(await repo.getCategoryBySlug("nope")).toBeNull();
    });

    it("returns active listings with relations and domain-typed values", async () => {
      const { items, total } = await repo.getListings({});
      expect(total).toBe(activeCount);
      expect(items).toHaveLength(activeCount);
      for (const item of items) {
        expect(item.status).toBe("active");
        expect(typeof item.price).toBe("number");
        expect(item.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(item.seller.businessName).toBeTruthy();
        expect(item.category.slug).toBeTruthy();
        expect(Array.isArray(item.images)).toBe(true);
        expect([...item.images].map((i) => i.sortOrder)).toEqual([...item.images].map((i) => i.sortOrder).sort((x, y) => x - y));
      }
    });

    it("filters by category, origin, price, verification and search", async () => {
      const cat = (await repo.getCategories()).find((c) => c.slug === "green-beans")!;
      for (const item of (await repo.getListings({ categorySlug: cat.slug })).items) expect(item.category.slug).toBe(cat.slug);
      for (const item of (await repo.getListings({ originRegion: "Gayo" })).items) expect(item.tasteProfile?.originRegion).toBe("Gayo");
      for (const item of (await repo.getListings({ minPrice: 80000, maxPrice: 200000 })).items) {
        expect(item.price).toBeGreaterThanOrEqual(80000);
        expect(item.price).toBeLessThanOrEqual(200000);
      }
      for (const item of (await repo.getListings({ isVerified: true })).items) expect(item.seller.isVerified).toBe(true);
      const upper = await repo.getListings({ search: "GAYO" });
      const lower = await repo.getListings({ search: "gayo" });
      expect(upper.total).toBeGreaterThan(0);
      expect(upper.total).toBe(lower.total);
    });

    it("sorts by price and recency, and paginates without overlap", async () => {
      const asc = (await repo.getListings({ sort: "price_asc" })).items.map((i) => i.price);
      const desc = (await repo.getListings({ sort: "price_desc" })).items.map((i) => i.price);
      expect(asc).toEqual([...asc].sort((a, b) => a - b));
      expect(desc).toEqual([...desc].sort((a, b) => b - a));
      const newest = (await repo.getListings({ sort: "newest" })).items.map((i) => i.createdAt);
      expect(newest).toEqual([...newest].sort().reverse());

      const first = await repo.getListings({ page: 1, pageSize: 3 });
      const second = await repo.getListings({ page: 2, pageSize: 3 });
      expect(first.items).toHaveLength(3);
      expect(first.total).toBe(activeCount);
      expect(second.items.filter((i) => first.items.some((f) => f.id === i.id))).toHaveLength(0);
    });

    it("returns distinct, sorted filter options", async () => {
      const options = await repo.getFilterOptions();
      for (const list of [options.origins, options.processes, options.roastLevels]) {
        expect(list.length).toBeGreaterThan(0);
        expect(list).toEqual([...new Set(list)].sort());
      }
      expect(options.origins).toContain("Gayo");
    });

    it("composes the feed: ad slots, no duplicates, nothing lost", async () => {
      const page1 = await repo.getCatalogFeed({}, 1);
      expect(page1.items.length).toBeLessThanOrEqual(12);
      const adSlots = page1.items.flatMap((item, index) => (item.isAd ? [index] : []));
      expect(adSlots.length).toBeLessThanOrEqual(3);
      for (const slot of adSlots) expect([0, 5, 10]).toContain(slot);
      for (const item of page1.items.filter((i) => i.isAd)) expect(isActiveBoost(item.listing)).toBe(true);

      const all = await repo.getCatalogFeed({}, 5);
      const ids = all.items.map((i) => i.listing.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toHaveLength(activeCount);
      expect(all.total).toBe(activeCount);
      expect(all.hasMore).toBe(false);

      const byPrice = await repo.getCatalogFeed({ sort: "price_asc" }, 1);
      expect(byPrice.items.some((i) => i.isAd)).toBe(false);
    });

    it("finds a listing by slug and id, or null", async () => {
      const first = SEED_LISTINGS[0];
      const bySlug = await repo.getListingBySlug(first.slug);
      expect(bySlug?.id).toBe(first.id);
      expect((await repo.getListingById(first.id))?.slug).toBe(first.slug);
      expect(await repo.getListingBySlug("nope")).toBeNull();
      expect(await repo.getListingById("nope")).toBeNull();
    });
  });

  describe("sellers, plans and stats", () => {
    it("loads a seller with listings, subscriptions, payments and the effective tier", async () => {
      const seller = await repo.getSellerById("seller-1");
      expect(seller?.tier).toBe("business");
      expect(seller?.listings.length).toBeGreaterThanOrEqual(3);
      expect(seller?.subscriptions?.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(seller?.payments)).toBe(true);
      expect((await repo.getSellerBySlug(seller!.slug))?.id).toBe("seller-1");
      expect(await repo.getSellerById("nope")).toBeNull();
      expect(await repo.getSellerBySlug("nope")).toBeNull();
      expect((await repo.getSellers()).length).toBe(6);
    });

    it("resolves plan states", async () => {
      expect((await repo.getSellerPlanState("seller-1")).tier).toBe("business");
      expect((await repo.getSellerPlanState("seller-2")).tier).toBe("growth");
      expect((await repo.getSellerPlanState("seller-4")).tier).toBe("free");
      expect((await repo.getSellerPlanState("nope")).tier).toBe("free");
    });

    it("reports seller stats whose parts add up", async () => {
      const stats = await repo.getSellerStats("seller-1");
      expect(stats.metrics).toHaveLength(30);
      expect(stats.totalViews).toBe(stats.metrics.reduce((s, m) => s + m.views, 0));
      expect(stats.totalClicks).toBe(stats.metrics.reduce((s, m) => s + m.clicks, 0));
      expect(stats.totalListings).toBeGreaterThanOrEqual(stats.activeListings);

      const rows = await repo.getSellerListingPerformance("seller-1");
      expect(rows.reduce((s, r) => s + r.views, 0)).toBe(stats.totalViews);
      expect(rows.reduce((s, r) => s + r.clicks, 0)).toBe(stats.totalClicks);
      expect(rows.reduce((s, r) => s + r.impressions, 0)).toBe(stats.totalImpressions);
      for (let i = 1; i < rows.length; i++) expect(rows[i - 1].clicks).toBeGreaterThanOrEqual(rows[i].clicks);

      const none = await repo.getSellerStats("nope");
      expect(none).toMatchObject({ totalViews: 0, totalListings: 0, metrics: [] });
    });

    it("lists inquiries per seller", async () => {
      const mine = await repo.getInquiries("seller-1");
      const all = await repo.getInquiries();
      expect(all.length).toBeGreaterThanOrEqual(mine.length);
      expect(await repo.getInquiries("nope")).toEqual([]);
    });
  });

  describe("admin reads", () => {
    it("keeps the overview consistent with the queue", async () => {
      const stats = await repo.getAdminStats();
      expect(stats.totalSellers).toBe(6);
      expect(stats.pendingVerifications).toBe((await repo.getPendingVerifications()).length);
      expect((await repo.getAdminListings()).length).toBe(stats.totalListings);
      expect(Array.isArray(stats.recentPayments)).toBe(true);
      expect((await repo.getSellerPayments("seller-1")).every((p) => p.sellerId === "seller-1")).toBe(true);
    });
  });

  describe("writes", () => {
    it("stores an inquiry and returns it first", async () => {
      const listing = SEED_LISTINGS[0];
      const created = await repo.createInquiry({
        listingId: listing.id,
        buyerName: "Kedai Uji",
        buyerContact: "08123456789",
        quantity: "10 kg",
        message: "Apakah stok masih tersedia?",
      });
      expect(created.id).toBeTruthy();
      const seller = (await repo.getListingById(listing.id))!.sellerId;
      expect((await repo.getInquiries(seller))[0].id).toBe(created.id);
    });

    it("updates a seller profile and keeps the bio when it is omitted", async () => {
      const before = await repo.getSellerById("seller-1");
      const updated = await repo.updateSellerProfile("seller-1", {
        businessName: "Nama Toko Baru",
        province: "Aceh",
        city: "Takengon",
        address: "Jl. Uji No. 1",
        whatsappNumber: "081234567890",
      });
      expect(updated?.businessName).toBe("Nama Toko Baru");
      expect(updated?.bio).toBe(before?.bio);
      expect((await repo.getSellerById("seller-1"))?.businessName).toBe("Nama Toko Baru");
      expect(await repo.updateSellerProfile("nope", { businessName: "xxx", province: "a", city: "b", address: "12345", whatsappNumber: "081234567890" })).toBeNull();
    });

    it("creates listings with ordered images, taste profile and unique slugs", async () => {
      const a = await repo.createListing("seller-1", form(categoryId));
      const b = await repo.createListing("seller-1", form(categoryId));
      expect(a?.sellerId).toBe("seller-1");
      expect(a?.price).toBe(91500);
      expect(a?.images.map((i) => i.url)).toEqual(["/api/mock-storage/a", "/api/mock-storage/b"]);
      expect(a?.tasteProfile).toMatchObject({ originRegion: "Gayo", acidityScore: 3.5, bodyScore: 4 });
      expect(b?.slug).toBe(`${a?.slug}-2`);
      expect((await repo.getListingBySlug(a!.slug))?.id).toBe(a?.id);
      expect((await repo.getListings({})).total).toBe(activeCount + 2);
      expect(await repo.createListing("seller-1", form("nope"))).toBeNull();
      expect(await repo.createListing("nope", form(categoryId))).toBeNull();
    });

    it("updates only the owner's listing and replaces its images", async () => {
      const created = (await repo.createListing("seller-1", form(categoryId, { title: "Untuk Diubah" })))!;
      expect(await repo.updateListing("seller-2", created.id, form(categoryId))).toBeNull();
      const updated = await repo.updateListing("seller-1", created.id, form(categoryId, {
        title: "Sudah Diubah",
        price: 120000,
        images: [{ url: "/api/mock-storage/z", path: "p/z" }],
      }));
      expect(updated).toMatchObject({ title: "Sudah Diubah", price: 120000 });
      expect(updated?.images.map((i) => i.url)).toEqual(["/api/mock-storage/z"]);
      expect(await repo.updateListing("seller-1", "nope", form(categoryId))).toBeNull();
    });

    it("keeps an admin-suspended listing suspended when the seller edits it", async () => {
      const created = (await repo.createListing("seller-1", form(categoryId, { title: "Akan Ditangguhkan" })))!;
      expect(await repo.moderateListing(created.id, "suspend")).toBe(true);
      const edited = await repo.updateListing("seller-1", created.id, form(categoryId, { title: "Diedit", status: "active" }));
      expect(edited?.status).toBe("suspended");
      expect((await repo.getListings({ search: "Diedit" })).total).toBe(0);
      expect(await repo.moderateListing(created.id, "approve")).toBe(true);
      expect((await repo.getListings({ search: "Diedit" })).total).toBe(1);
      expect(await repo.moderateListing("nope", "suspend")).toBe(false);
    });

    it("activates boosts, recording credit orders separately", async () => {
      const listing = (await repo.createListing("seller-1", form(categoryId, { title: "Untuk Boost" })))!;
      const before = (await repo.getSellerPayments("seller-1")).length;
      const credit = await repo.activateBoost("seller-1", listing.id, 7, 0);
      expect(credit).toMatchObject({ type: "boost", status: "paid", amount: 0, listingId: listing.id });
      expect(credit?.midtransOrderId).toMatch(/^CREDIT-BOOST-/);
      const reloaded = await repo.getListingById(listing.id);
      expect(isActiveBoost(reloaded!)).toBe(true);
      expect((await repo.getSellerPayments("seller-1")).length).toBe(before + 1);

      const paid = await repo.activateBoost("seller-1", listing.id, 14, 45000);
      expect(paid?.midtransOrderId).toMatch(/^MOCK-BOOST-/);
      expect(paid?.amount).toBe(45000);
      expect(await repo.activateBoost("seller-2", listing.id, 7, 0)).toBeNull();
      expect(await repo.activateBoost("seller-1", "nope", 7, 0)).toBeNull();
    });

    it("runs a subscription from free to upgrade, renewal, cancel and resume", async () => {
      const free = await repo.getSellerPlanState("seller-4");
      const start = decidePlanChange(free, "growth", 12);
      expect(start.ok && start.kind).toBe("new");
      if (!start.ok) return;
      const started = await repo.startSubscription({ sellerId: "seller-4", tier: "growth", kind: "new", expiresAt: start.expiresAt, amount: 790000 });
      expect(started?.payment).toMatchObject({ type: "subscription", status: "paid", amount: 790000, subscriptionId: started?.subscription.id });
      expect((await repo.getSellerPlanState("seller-4")).tier).toBe("growth");
      expect((await repo.getSellerById("seller-4"))?.tier).toBe("growth");

      expect(await repo.setCancelAtPeriodEnd("seller-4", true)).toBe(true);
      expect((await repo.getSellerPlanState("seller-4")).cancelAtPeriodEnd).toBe(true);
      expect(await repo.setCancelAtPeriodEnd("seller-4", false)).toBe(true);
      expect((await repo.getSellerPlanState("seller-4")).cancelAtPeriodEnd).toBe(false);

      const growth = await repo.getSellerPlanState("seller-4");
      const up = decidePlanChange(growth, "business", 1);
      expect(up.ok && up.kind).toBe("upgrade");
      if (!up.ok) return;
      await repo.startSubscription({ sellerId: "seller-4", tier: "business", kind: "upgrade", expiresAt: up.expiresAt, amount: 149000 });
      const business = await repo.getSellerPlanState("seller-4");
      expect(business.tier).toBe("business");

      const renew = decidePlanChange(business, "business", 1);
      expect(renew.ok && renew.kind).toBe("renew");
      if (!renew.ok) return;
      await repo.setCancelAtPeriodEnd("seller-4", true);
      await repo.startSubscription({ sellerId: "seller-4", tier: "business", kind: "renew", expiresAt: renew.expiresAt, amount: 149000 });
      const renewed = await repo.getSellerPlanState("seller-4");
      expect(renewed.expiresAt).toBe(renew.expiresAt);
      expect(renewed.cancelAtPeriodEnd).toBe(false);
    });

    it("refuses subscription changes that do not make sense", async () => {
      expect(await repo.startSubscription({ sellerId: "nope", tier: "growth", kind: "new", expiresAt: iso(30), amount: 1 })).toBeNull();
      expect(await repo.startSubscription({ sellerId: "seller-2", tier: "business", kind: "renew", expiresAt: iso(30), amount: 1 })).toBeNull();
      expect(await repo.setCancelAtPeriodEnd("nope", true)).toBe(false);
    });

    it("rejects a verification request, then approves it later", async () => {
      const pending = await repo.getPendingVerifications();
      expect(pending.length).toBeGreaterThanOrEqual(1);
      const seller = pending[0];

      expect(await repo.reviewVerification(seller.id, "reject")).toBe(true);
      const afterReject = await repo.getPendingVerifications();
      expect(afterReject.some((s) => s.id === seller.id)).toBe(false);
      expect((await repo.getSellerById(seller.id))?.isVerified).toBe(false);
      expect((await repo.getAdminStats()).pendingVerifications).toBe(afterReject.length);

      expect(await repo.reviewVerification(seller.id, "approve")).toBe(true);
      expect((await repo.getSellerById(seller.id))?.isVerified).toBe(true);
      expect((await repo.getPendingVerifications()).some((s) => s.id === seller.id)).toBe(false);
      expect(await repo.reviewVerification("nope", "approve")).toBe(false);
    });

    it("records analytics events with validation and de-duplication", async () => {
      const organic = (await repo.getListings({})).items.find((l) => !isActiveBoost(l) && l.sellerId === "seller-1")!;
      const boosted = (await repo.getListings({})).items.find((l) => isActiveBoost(l))!;
      const session = sessionId();

      const before = await repo.getSellerStats("seller-1");
      expect(await repo.recordTrackEvent({ listingId: organic.id, type: "view", sessionId: session })).toBe("recorded");
      expect(await repo.recordTrackEvent({ listingId: organic.id, type: "view", sessionId: session })).toBe("duplicate");
      expect(await repo.recordTrackEvent({ listingId: organic.id, type: "contact_click", sessionId: session })).toBe("recorded");
      expect(await repo.recordTrackEvent({ listingId: organic.id, type: "impression", sessionId: session })).toBe("ignored");
      expect(await repo.recordTrackEvent({ listingId: "nope", type: "view", sessionId: session })).toBe("ignored");
      expect(await repo.recordTrackEvent({ listingId: boosted.id, type: "impression", sessionId: session })).toBe("recorded");
      expect(await repo.recordTrackEvent({ listingId: organic.id, type: "view", sessionId: sessionId() })).toBe("recorded");

      const after = await repo.getSellerStats("seller-1");
      expect(after.totalViews).toBe(before.totalViews + 2);
      expect(after.totalClicks).toBe(before.totalClicks + 1);
      expect(after.metrics[29].views).toBe(before.metrics[29].views + 2);
    });
  });
});
