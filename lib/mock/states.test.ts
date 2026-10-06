import { afterEach, describe, expect, it } from "vitest";
import {
  configureMock,
  getAdminListings,
  getAdminStats,
  getCatalogFeed,
  getInquiries,
  getPendingVerifications,
  getSellerById,
  getSellerListingPerformance,
  getSellerStats,
  resetMockConfig,
} from "@/lib/mock/repository";

afterEach(() => resetMockConfig());

describe("QA state: error", () => {
  it("every reader rejects with the configured message", async () => {
    configureMock({
      shouldFail: true,
      simulateLatencyMs: 0,
      errorMessage: "boom",
    });
    const readers = [
      () => getCatalogFeed({}, 1),
      () => getSellerById("seller-1"),
      () => getSellerStats("seller-1"),
      () => getSellerListingPerformance("seller-1"),
      () => getInquiries("seller-1"),
      () => getAdminStats(),
      () => getAdminListings(),
      () => getPendingVerifications(),
    ];
    for (const read of readers) await expect(read()).rejects.toThrow("boom");
  });
});

describe("QA state: empty", () => {
  it("every collection comes back empty", async () => {
    configureMock({ forceEmptyListings: true, simulateLatencyMs: 0 });

    const feed = await getCatalogFeed({}, 1);
    expect(feed.items).toEqual([]);
    expect(feed.total).toBe(0);
    expect(feed.hasMore).toBe(false);

    const seller = await getSellerById("seller-1");
    expect(seller).not.toBeNull();
    expect(seller?.listings).toEqual([]);
    expect(seller?.payments).toEqual([]);

    const stats = await getSellerStats("seller-1");
    expect(stats).toMatchObject({
      totalViews: 0,
      totalClicks: 0,
      totalListings: 0,
      inquiryCount: 0,
      metrics: [],
    });

    expect(await getSellerListingPerformance("seller-1")).toEqual([]);
    expect(await getInquiries("seller-1")).toEqual([]);
    expect(await getAdminListings()).toEqual([]);
    expect(await getPendingVerifications()).toEqual([]);

    const admin = await getAdminStats();
    expect(admin).toMatchObject({
      totalListings: 0,
      pendingVerifications: 0,
      monthlyRevenue: 0,
      recentPayments: [],
    });
  });

  it("resetMockConfig restores normal data", async () => {
    configureMock({ forceEmptyListings: true, simulateLatencyMs: 0 });
    resetMockConfig();
    configureMock({ simulateLatencyMs: 0 });
    expect((await getCatalogFeed({}, 1)).items.length).toBeGreaterThan(0);
  });
});
