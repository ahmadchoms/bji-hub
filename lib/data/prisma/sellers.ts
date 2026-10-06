import type { DataRepository } from "@/lib/data/contract";
import { getPrisma } from "@/lib/data/prisma/client";
import { isNotFound, isUniqueViolation } from "@/lib/data/prisma/errors";
import { listingInclude, toInquiry, toListing, toPayment, toSeller, toSubscription } from "@/lib/data/prisma/mappers";
import { slugify, uniqueSlug } from "@/lib/slug";
import { resolvePlanState } from "@/lib/subscription";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ListingFormValues } from "@/lib/validations/listing.schema";
import type { SellerWithRelations } from "@/types";

const sellerInclude = {
  listings: { include: listingInclude, orderBy: [{ createdAt: "desc" }, { id: "asc" }] },
  subscriptions: true,
  payments: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.SellerProfileInclude;

type SellerRow = Prisma.SellerProfileGetPayload<{ include: typeof sellerInclude }>;

function toSellerWithRelations(row: SellerRow): SellerWithRelations {
  const subscriptions = row.subscriptions.map(toSubscription);
  return {
    ...toSeller(row),
    listings: row.listings.map(toListing),
    subscriptions,
    tier: resolvePlanState(subscriptions).tier,
    payments: row.payments.map(toPayment),
  };
}

function tasteData(data: ListingFormValues) {
  return {
    originRegion: data.originRegion,
    processMethod: data.processMethod,
    roastLevel: data.roastLevel,
    flavorNotes: data.flavorNotes,
    acidityScore: data.acidityScore,
    bodyScore: data.bodyScore,
    sweetnessScore: data.sweetnessScore ?? null,
    aromaScore: data.aromaScore ?? null,
    aftertasteScore: data.aftertasteScore ?? null,
    roastDate: new Date(data.roastDate),
  };
}

const imageRows = (data: ListingFormValues) => data.images.map((image, index) => ({ url: image.url, sortOrder: index }));

type SellerMethods = Pick<
  DataRepository,
  | "getSellerBySlug"
  | "getSellerById"
  | "getSellers"
  | "getInquiries"
  | "createInquiry"
  | "updateSellerProfile"
  | "createListing"
  | "updateListing"
>;

export const sellers: SellerMethods = {
  async getSellerBySlug(slug) {
    const row = await getPrisma().sellerProfile.findUnique({ where: { slug }, include: sellerInclude });
    return row ? toSellerWithRelations(row) : null;
  },

  async getSellerById(id) {
    const row = await getPrisma().sellerProfile.findUnique({ where: { id }, include: sellerInclude });
    return row ? toSellerWithRelations(row) : null;
  },

  async getSellers() {
    const rows = await getPrisma().sellerProfile.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    return rows.map(toSeller);
  },

  async getInquiries(sellerId) {
    const rows = await getPrisma().inquiry.findMany({
      where: sellerId ? { listing: { is: { sellerId } } } : undefined,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return rows.map(toInquiry);
  },

  async createInquiry(input) {
    const row = await getPrisma().inquiry.create({ data: input });
    return toInquiry(row);
  },

  async updateSellerProfile(sellerId, data) {
    try {
      const row = await getPrisma().sellerProfile.update({
        where: { id: sellerId },
        data: {
          businessName: data.businessName,
          province: data.province,
          city: data.city,
          address: data.address,
          whatsappNumber: data.whatsappNumber,
          bio: data.bio,
        },
      });
      return toSeller(row);
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },

  async createListing(sellerId, data) {
    const prisma = getPrisma();
    const [seller, category] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { id: sellerId }, select: { id: true } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);
    if (!seller || !category) return null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const root = slugify(data.title) || "produk";
      const existing = await prisma.listing.findMany({ where: { slug: { startsWith: root } }, select: { slug: true } });
      const slug = uniqueSlug(data.title, new Set(existing.map((row) => row.slug)));
      try {
        const row = await prisma.listing.create({
          data: {
            slug,
            sellerId,
            categoryId: category.id,
            title: data.title,
            description: data.description,
            price: data.price,
            unit: data.unit,
            minOrderQty: data.minOrderQty,
            status: data.status,
            tasteProfile: { create: tasteData(data) },
            images: { create: imageRows(data) },
          },
          include: listingInclude,
        });
        return toListing(row);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new Error("Could not allocate a unique slug for the listing");
  },

  /** Returns null when the listing does not exist or belongs to another seller. */
  async updateListing(sellerId, listingId, data) {
    const prisma = getPrisma();
    const [listing, category] = await Promise.all([
      prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true, status: true } }),
      prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
    ]);
    if (!listing || listing.sellerId !== sellerId || !category) return null;

    const taste = tasteData(data);
    const row = await prisma.$transaction(async (tx) => {
      await tx.listingImage.deleteMany({ where: { listingId } });
      return tx.listing.update({
        where: { id: listingId },
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          unit: data.unit,
          minOrderQty: data.minOrderQty,
          categoryId: category.id,
          // A listing suspended by an admin cannot be reactivated by the seller.
          status: listing.status === "suspended" ? "suspended" : data.status,
          images: { create: imageRows(data) },
          tasteProfile: { upsert: { create: taste, update: taste } },
        },
        include: listingInclude,
      });
    });
    return toListing(row);
  },
};
