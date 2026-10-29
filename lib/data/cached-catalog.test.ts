import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache unstable_cache to pass-through fn in testing environment
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/lib/data", () => ({
  getListings: vi.fn(async (filters) => ({ items: [{ id: "l1", title: "Kopi Gayo" }], total: 1 })),
  getCatalogFeed: vi.fn(async (filters, upToPage) => ({ items: [{ listing: { id: "l1" }, isAd: false }], total: 1, hasMore: false })),
}));

import { normalizeFilters, getCatalogCached, getCatalogFeedCached } from "./cached-catalog";
import { getListings, getCatalogFeed } from "@/lib/data";

describe("cached-catalog (N3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeFilters", () => {
    it("strips empty strings, undefined, and null values", () => {
      const input = {
        categorySlug: "arabica",
        search: "",
        minPrice: undefined,
        maxPrice: null,
        roastLevel: "medium",
      };
      const clean = normalizeFilters(input);
      expect(clean).toEqual({
        categorySlug: "arabica",
        roastLevel: "medium",
      });
    });

    it("sorts keys alphabetically for deterministic cache keys", () => {
      const input1 = { z: "last", a: "first", m: "middle" };
      const input2 = { a: "first", m: "middle", z: "last" };
      expect(JSON.stringify(normalizeFilters(input1))).toBe(JSON.stringify(normalizeFilters(input2)));
      expect(Object.keys(normalizeFilters(input1))).toEqual(["a", "m", "z"]);
    });
  });

  describe("getCatalogCached", () => {
    it("parses filter key and delegates to getListings", async () => {
      const filters = { categorySlug: "arabica", sort: "freshest" };
      const key = JSON.stringify(normalizeFilters(filters));
      const result = await getCatalogCached(key);

      expect(getListings).toHaveBeenCalledWith(filters);
      expect(result).toEqual({ items: [{ id: "l1", title: "Kopi Gayo" }], total: 1 });
    });
  });

  describe("getCatalogFeedCached", () => {
    it("parses filter key and delegates to getCatalogFeed with page", async () => {
      const filters = { search: "aceh" };
      const key = JSON.stringify(normalizeFilters(filters));
      const result = await getCatalogFeedCached(key, 2);

      expect(getCatalogFeed).toHaveBeenCalledWith(filters, 2);
      expect(result.total).toBe(1);
    });
  });
});
