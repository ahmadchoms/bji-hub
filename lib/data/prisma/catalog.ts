import type { Prisma } from "@/lib/generated/prisma/client";
import { composeFeedPage } from "@/lib/boost";
import type { DataRepository } from "@/lib/data/contract";
import { getPrisma } from "@/lib/data/prisma/client";
import {
  listingInclude,
  toCategory,
  toListing,
} from "@/lib/data/prisma/mappers";
import type { CatalogFeedResult, FeedItem, ListingFilters } from "@/types";

const ALL = "all";
const PAGE_SIZE = 12;

function buildWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "active" };

  if (filters.categorySlug && filters.categorySlug !== ALL)
    where.category = { slug: filters.categorySlug };

  const taste: Prisma.TasteProfileWhereInput = {};
  if (filters.originRegion && filters.originRegion !== ALL)
    taste.originRegion = filters.originRegion;
  if (filters.processMethod && filters.processMethod !== ALL)
    taste.processMethod = filters.processMethod;
  if (filters.roastLevel && filters.roastLevel !== ALL)
    taste.roastLevel = filters.roastLevel;
  if (Object.keys(taste).length > 0) where.tasteProfile = { is: taste };

  if (filters.isVerified) where.seller = { is: { isVerified: true } };
  if (filters.isBoosted) where.isBoosted = true;

  const price: Prisma.DecimalFilter = {};
  if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice))
    price.gte = filters.minPrice;
  if (typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice))
    price.lte = filters.maxPrice;
  if (Object.keys(price).length > 0) where.price = price;

  const q = filters.search?.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    where.OR = [
      { title: contains },
      { seller: { is: { businessName: contains } } },
      { tasteProfile: { is: { originRegion: contains } } },
      { tasteProfile: { is: { flavorNotes: contains } } },
    ];
  }
  return where;
}

function buildOrderBy(
  sort: ListingFilters["sort"],
): Prisma.ListingOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }, { id: "asc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { id: "asc" }];
  if (sort === "popular") return [{ minOrderQty: "asc" }, { id: "asc" }];
  return [{ createdAt: "desc" }, { id: "asc" }];
}

async function distinct(
  field: "originRegion" | "processMethod" | "roastLevel",
): Promise<string[]> {
  const rows = await getPrisma().tasteProfile.groupBy({ by: [field] });
  return rows.map((row) => row[field]).sort();
}

type CatalogMethods = Pick<
  DataRepository,
  | "getCategories"
  | "getCategoryBySlug"
  | "getListings"
  | "getListingFeed"
  | "getCatalogFeed"
  | "getFilterOptions"
  | "getListingBySlug"
  | "getListingById"
>;

export const catalog: CatalogMethods = {
  async getCategories() {
    const rows = await getPrisma().category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(toCategory);
  },

  async getCategoryBySlug(slug) {
    const row = await getPrisma().category.findUnique({ where: { slug } });
    return row ? toCategory(row) : null;
  },

  async getListings(filters = {}) {
    const prisma = getPrisma();
    const where = buildWhere(filters);
    const pageSize =
      filters.pageSize && filters.pageSize > 0
        ? Math.floor(filters.pageSize)
        : undefined;
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: buildOrderBy(filters.sort),
        include: listingInclude,
        skip: pageSize ? (page - 1) * pageSize : undefined,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);
    return { items: rows.map(toListing), total };
  },

  async getListingFeed(filters = {}) {
    return catalog.getListings(filters);
  },

  async getCatalogFeed(filters, upToPage): Promise<CatalogFeedResult> {
    const prisma = getPrisma();
    const slim = await prisma.listing.findMany({
      where: buildWhere(filters),
      orderBy: buildOrderBy(filters.sort),
      select: { id: true, sellerId: true, isBoosted: true, boostUntil: true },
    });
    const candidates = slim as unknown as Parameters<
      typeof composeFeedPage
    >[0]["allFiltered"];

    const isPriceSort =
      filters.sort === "price_asc" || filters.sort === "price_desc";
    const seed = Math.floor(Date.now() / 3_600_000);

    const placed: { listing: (typeof candidates)[number]; isAd: boolean }[] =
      [];
    for (let page = 1; page <= upToPage; page++) {
      const pageItems = composeFeedPage({
        allFiltered: candidates,
        isPriceSort,
        page,
        pageSize: PAGE_SIZE,
        adSlotIndexes: [0, 5, 10],
        seed,
      });
      if (pageItems.length === 0) break;
      placed.push(...pageItems);
    }

    const rows = await prisma.listing.findMany({
      where: { id: { in: placed.map((p) => p.listing.id) } },
      include: listingInclude,
    });
    const byId = new Map(rows.map((row) => [row.id, toListing(row)]));
    const items: FeedItem[] = placed.flatMap((p) => {
      const listing = byId.get(p.listing.id);
      return listing ? [{ listing, isAd: p.isAd }] : [];
    });

    return {
      items,
      total: candidates.length,
      hasMore: upToPage * PAGE_SIZE < candidates.length,
    };
  },

  async getFilterOptions() {
    const [origins, processes, roastLevels] = await Promise.all([
      distinct("originRegion"),
      distinct("processMethod"),
      distinct("roastLevel"),
    ]);
    return { origins, processes, roastLevels };
  },

  async getListingBySlug(slug) {
    const row = await getPrisma().listing.findUnique({
      where: { slug },
      include: listingInclude,
    });
    return row ? toListing(row) : null;
  },

  async getListingById(id) {
    const row = await getPrisma().listing.findUnique({
      where: { id },
      include: listingInclude,
    });
    return row ? toListing(row) : null;
  },
};
