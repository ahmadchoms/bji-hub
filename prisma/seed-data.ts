import crypto from "crypto";
import type { PrismaClient } from "../lib/generated/prisma/client";
import {
  mockCategories,
  mockInquiries,
  mockListings,
  mockPayments,
  mockSellers,
  mockSubscriptions,
} from "../lib/mock/data";
import { generateDemoEvents } from "../lib/mock/analytics-store";

const TABLES = [
  "analytics_events",
  "inquiries",
  "payments",
  "subscriptions",
  "listing_images",
  "taste_profiles",
  "listings",
  "categories",
  "seller_profiles",
  "users",
];

/** Converts any identifier deterministically to a standard RFC 4122 UUID v4 */
function toUUID(str: string): string {
  const hash = crypto.createHash("sha256").update(str).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join("-");
}

const date = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

async function createInChunks<T>(rows: T[], create: (chunk: T[]) => Promise<unknown>, size = 1000): Promise<void> {
  for (let i = 0; i < rows.length; i += size) await create(rows.slice(i, i + size));
}

/** Wipes every table and loads seed data with professional standard UUIDs by default. */
export async function seedDatabase(
  prisma: PrismaClient,
  options: { useUUIDs?: boolean } = { useUUIDs: true }
): Promise<Record<string, number>> {
  const getId = options.useUUIDs ? toUUID : (id: string) => id;

  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);

  await prisma.user.createMany({
    data: [
      { id: getId("user-admin"), email: "admin@example.com", role: "ADMIN" as const },
      ...mockSellers.map((seller) => ({
        id: getId(seller.userId),
        email: `${seller.slug}@example.com`,
        role: "SELLER" as const,
        createdAt: new Date(seller.createdAt),
      })),
    ],
  });

  await prisma.sellerProfile.createMany({
    data: mockSellers.map((seller) => ({
      id: getId(seller.id),
      userId: getId(seller.userId),
      businessName: seller.businessName,
      slug: seller.slug,
      province: seller.province,
      city: seller.city,
      address: seller.address,
      whatsappNumber: seller.whatsappNumber,
      bio: seller.bio ?? null,
      avatarUrl: seller.avatarUrl ?? null,
      isVerified: seller.isVerified,
      verificationStatus: seller.isVerified ? ("approved" as const) : ("pending" as const),
      tier: seller.tier,
      createdAt: new Date(seller.createdAt),
    })),
  });

  await prisma.category.createMany({
    data: mockCategories.map((category, index) => ({
      id: getId(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      sortOrder: index,
    })),
  });

  await prisma.listing.createMany({
    data: mockListings.map((listing) => ({
      id: getId(listing.id),
      slug: listing.slug,
      sellerId: getId(listing.sellerId),
      categoryId: getId(listing.categoryId),
      title: listing.title,
      description: listing.description,
      price: listing.price,
      unit: listing.unit,
      minOrderQty: listing.minOrderQty,
      stock: listing.stock ?? 100,
      status: listing.status,
      isBoosted: listing.isBoosted,
      boostUntil: date(listing.boostUntil),
      createdAt: new Date(listing.createdAt),
    })),
  });

  await prisma.tasteProfile.createMany({
    data: mockListings.flatMap((listing) =>
      listing.tasteProfile
        ? [
            {
              id: getId(listing.tasteProfile.id),
              listingId: getId(listing.id),
              originRegion: listing.tasteProfile.originRegion,
              processMethod: listing.tasteProfile.processMethod,
              roastLevel: listing.tasteProfile.roastLevel,
              flavorNotes: listing.tasteProfile.flavorNotes,
              acidityScore: listing.tasteProfile.acidityScore,
              bodyScore: listing.tasteProfile.bodyScore,
              sweetnessScore: listing.tasteProfile.sweetnessScore ?? null,
              aromaScore: listing.tasteProfile.aromaScore ?? null,
              aftertasteScore: listing.tasteProfile.aftertasteScore ?? null,
              cuppingScore: listing.tasteProfile.cuppingScore ?? null,
              altitude: listing.tasteProfile.altitude ?? null,
              cropYear: listing.tasteProfile.cropYear ?? null,
              moistureContent: listing.tasteProfile.moistureContent ?? null,
              roastDate: new Date(listing.tasteProfile.roastDate),
            },
          ]
        : []
    ),
  });

  await prisma.listingImage.createMany({
    data: mockListings.flatMap((listing) =>
      listing.images.map((image) => ({
        id: getId(image.id),
        listingId: getId(listing.id),
        url: image.url,
        sortOrder: image.sortOrder,
      }))
    ),
  });

  await prisma.subscription.createMany({
    data: mockSubscriptions.map((sub) => ({
      id: getId(sub.id),
      sellerId: getId(sub.sellerId),
      tier: sub.tier,
      status: sub.status,
      startedAt: new Date(sub.startedAt),
      expiresAt: new Date(sub.expiresAt),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    })),
  });

  await prisma.payment.createMany({
    data: mockPayments.map((payment) => ({
      id: getId(payment.id),
      sellerId: getId(payment.sellerId),
      subscriptionId: payment.subscriptionId ? getId(payment.subscriptionId) : null,
      listingId: payment.listingId ? getId(payment.listingId) : null,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      midtransOrderId: payment.midtransOrderId,
      paidAt: date(payment.paidAt),
      createdAt: new Date(payment.createdAt),
    })),
  });

  await prisma.inquiry.createMany({
    data: mockInquiries.map((inquiry) => ({
      id: getId(inquiry.id),
      listingId: getId(inquiry.listingId),
      buyerName: inquiry.buyerName,
      buyerContact: inquiry.buyerContact,
      quantity: inquiry.quantity,
      message: inquiry.message,
      createdAt: new Date(inquiry.createdAt),
    })),
  });

  const events = generateDemoEvents();
  await createInChunks(events, (chunk) =>
    prisma.analyticsEvent.createMany({
      data: chunk.map((event) => ({
        id: getId(event.id),
        listingId: getId(event.listingId),
        eventType: event.eventType,
        createdAt: new Date(event.createdAt),
      })),
    })
  );

  return {
    sellers: mockSellers.length,
    categories: mockCategories.length,
    listings: mockListings.length,
    subscriptions: mockSubscriptions.length,
    payments: mockPayments.length,
    inquiries: mockInquiries.length,
    events: events.length,
  };
}
