import { unstable_cache } from "next/cache";
import { CATALOG_TAG } from "@/lib/cache/revalidate";
import { getListings, getCatalogFeed } from "@/lib/data";
import type { ListingFilters, CatalogFeedResult } from "@/types";

/**
 * Normalizes filter parameters by removing empty/undefined/null keys and
 * sorting keys alphabetically to guarantee a deterministic canonical cache key.
 */
export function normalizeFilters(filters: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  const sortedKeys = Object.keys(filters).sort();
  for (const k of sortedKeys) {
    const val = filters[k];
    if (val !== undefined && val !== null && val !== "") {
      clean[k] = val;
    }
  }
  return clean;
}

export const getCatalogCached = unstable_cache(
  async (filtersKey: string) => {
    const filters: ListingFilters = filtersKey ? JSON.parse(filtersKey) : {};
    return getListings(filters);
  },
  ["catalog-listings"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);

export const getCatalogFeedCached = unstable_cache(
  async (filtersKey: string, upToPage: number = 1): Promise<CatalogFeedResult> => {
    const filters: ListingFilters = filtersKey ? JSON.parse(filtersKey) : {};
    return getCatalogFeed(filters, upToPage);
  },
  ["catalog-feed"],
  { revalidate: 120, tags: [CATALOG_TAG] },
);
