import { PrismaClient } from "@/lib/generated/prisma/client";
import {
  mockCategories,
  mockInquiries,
  mockListings,
  mockPayments,
  mockSellers,
  mockSubscriptions,
} from "../lib/mock/data";

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

const date = (value: string | null | undefined): Date | null =>
  value ? new Date(value) : null;

async function createInChunks<T>(
  rows: T[],
  create: (chunk: T[]) => Promise<unknown>,
  size = 1000,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size)
    await create(rows.slice(i, i + size));
}

/** Wipes every table and loads the demo data (the same data the mock repository serves). */
export async function seedDatabase(
  prisma: PrismaClient,
): Promise<Record<string, number>> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );

  await prisma.user.createMany({
    data: [
      { id: "user-admin", email: "admin@example.com", role: "ADMIN" as const },
      ...mockSellers.map((seller) => ({
        id: seller.userId,
        email: `${seller.slug}@example.com`,
        role: "SELLER" as const,
        createdAt: new Date(seller.createdAt),
      })),
    ],
  });

  await prisma.sellerProfile.createMany({
    data: mockSellers.map((seller) => ({
      id: seller.id,
      userId: seller.userId,
      businessName: seller.businessName,
      slug: seller.slug,
      province: seller.province,
      city: seller.city,
      address: seller.address,
      whatsappNumber: seller.whatsappNumber,
      bio: seller.bio ?? null,
      avatarUrl: seller.avatarUrl ?? null,
      isVerified: seller.isVerified,
      verificationStatus: seller.isVerified
        ? ("approved" as const)
        : ("pending" as const),
      tier: seller.tier,
      createdAt: new Date(seller.createdAt),
    })),
  });

  await prisma.category.createMany({
    data: mockCategories.map((category, index) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      sortOrder: index,
    })),
  });

  await prisma.listing.createMany({
    data: mockListings.map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      sellerId: listing.sellerId,
      categoryId: listing.categoryId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      unit: listing.unit,
      minOrderQty: listing.minOrderQty,
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
              id: listing.tasteProfile.id,
              listingId: listing.id,
              originRegion: listing.tasteProfile.originRegion,
              processMethod: listing.tasteProfile.processMethod,
              roastLevel: listing.tasteProfile.roastLevel,
              flavorNotes: listing.tasteProfile.flavorNotes,
              acidityScore: listing.tasteProfile.acidityScore,
              bodyScore: listing.tasteProfile.bodyScore,
              sweetnessScore: listing.tasteProfile.sweetnessScore ?? null,
              aromaScore: listing.tasteProfile.aromaScore ?? null,
              aftertasteScore: listing.tasteProfile.aftertasteScore ?? null,
              roastDate: new Date(listing.tasteProfile.roastDate),
            },
          ]
        : [],
    ),
  });

  await prisma.listingImage.createMany({
    data: mockListings.flatMap((listing) =>
      listing.images.map((image) => ({
        id: image.id,
        listingId: listing.id,
        url: image.url,
        sortOrder: image.sortOrder,
      })),
    ),
  });

  await prisma.subscription.createMany({
    data: mockSubscriptions.map((sub) => ({
      id: sub.id,
      sellerId: sub.sellerId,
      tier: sub.tier,
      status: sub.status,
      startedAt: new Date(sub.startedAt),
      expiresAt: new Date(sub.expiresAt),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    })),
  });

  await prisma.payment.createMany({
    data: mockPayments.map((payment) => ({
      id: payment.id,
      sellerId: payment.sellerId,
      subscriptionId: payment.subscriptionId ?? null,
      listingId: payment.listingId ?? null,
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
      id: inquiry.id,
      listingId: inquiry.listingId,
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
        id: event.id,
        listingId: event.listingId,
        eventType: event.eventType,
        createdAt: new Date(event.createdAt),
      })),
    }),
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
