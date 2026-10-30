import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  Category,
  Inquiry,
  ListingWithRelations,
  Payment,
  SellerProfile,
  Subscription,
  TasteProfile,
} from "@/types";

type Decimalish = { toNumber(): number } | number;
const num = (value: Decimalish): number => (typeof value === "number" ? value : value.toNumber());
const numOrUndef = (value: Decimalish | null): number | undefined => (value === null ? undefined : num(value));
const iso = (value: Date): string => value.toISOString();

export const listingInclude = {
  seller: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  tasteProfile: true,
  flavorTags: true,
} satisfies Prisma.ListingInclude;

export type ListingRow = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;
type SellerRow = Prisma.SellerProfileGetPayload<object>;
type TasteRow = Prisma.TasteProfileGetPayload<object>;

export function toCategory(row: Prisma.CategoryGetPayload<object>): Category {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description ?? undefined };
}

export function toSeller(row: SellerRow): SellerProfile {
  return {
    id: row.id,
    userId: row.userId,
    businessName: row.businessName,
    slug: row.slug,
    province: row.province,
    city: row.city,
    address: row.address,
    whatsappNumber: row.whatsappNumber,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    bankName: ((row as Record<string, unknown>).bankName || (row as Record<string, unknown>).bank_name) as string | undefined,
    bankAccountNumber: ((row as Record<string, unknown>).bankAccountNumber || (row as Record<string, unknown>).bank_account_number) as string | undefined,
    bankAccountHolder: ((row as Record<string, unknown>).bankAccountHolder || (row as Record<string, unknown>).bank_account_holder) as string | undefined,
    bankUpdatedAt: (row as Record<string, unknown>).bankUpdatedAt ? iso((row as Record<string, unknown>).bankUpdatedAt as Date) : undefined,
    kycDocumentUrl: ((row as Record<string, unknown>).kycDocumentUrl || (row as Record<string, unknown>).kyc_document_url) as string | undefined,
    kycSubmittedAt: (row as Record<string, unknown>).kycSubmittedAt ? iso((row as Record<string, unknown>).kycSubmittedAt as Date) : undefined,
    isVerified: row.isVerified,
    verificationStatus: row.verificationStatus,
    tier: row.tier,
    createdAt: iso(row.createdAt),
  };
}

export function toTaste(row: TasteRow): TasteProfile {
  return {
    id: row.id,
    listingId: row.listingId,
    originRegion: row.originRegion,
    processMethod: row.processMethod as TasteProfile["processMethod"],
    roastLevel: row.roastLevel as TasteProfile["roastLevel"],
    flavorNotes: row.flavorNotes,
    acidityScore: num(row.acidityScore),
    bodyScore: num(row.bodyScore),
    sweetnessScore: numOrUndef(row.sweetnessScore),
    aromaScore: numOrUndef(row.aromaScore),
    aftertasteScore: numOrUndef(row.aftertasteScore),
    cropYear: row.cropYear ?? undefined,
    moistureContent: row.moistureContent ? num(row.moistureContent) : undefined,
    cuppingScore: row.cuppingScore ? num(row.cuppingScore) : undefined,
    altitude: row.altitude ?? undefined,
    producerId: (((row as Record<string, unknown>).producerId || (row as Record<string, unknown>).producer_id) as string) ?? undefined,
    lotCode: (((row as Record<string, unknown>).lotCode || (row as Record<string, unknown>).lot_code) as string) ?? undefined,
    varieties: (((row as Record<string, unknown>).varieties as string[]) || []),
    harvestMonth: (((row as Record<string, unknown>).harvestMonth ?? (row as Record<string, unknown>).harvest_month) as number) ?? undefined,
    fermentationHours: (((row as Record<string, unknown>).fermentationHours ?? (row as Record<string, unknown>).fermentation_hours) as number) ?? undefined,
    dryingDays: (((row as Record<string, unknown>).dryingDays ?? (row as Record<string, unknown>).drying_days) as number) ?? undefined,
    roastDate: iso(row.roastDate),
  };
}

export function toListing(row: ListingRow): ListingWithRelations {
  return {
    id: row.id,
    slug: row.slug,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    title: row.title,
    description: row.description ?? "",
    price: num(row.price),
    unit: row.unit,
    minOrderQty: row.minOrderQty,
    stock: row.stock,
    status: row.status,
    isBoosted: row.isBoosted,
    boostUntil: row.boostUntil ? iso(row.boostUntil) : null,
    ratingAvg: (row as { ratingAvg?: unknown }).ratingAvg ? num((row as { ratingAvg?: unknown }).ratingAvg as Prisma.Decimal) : null,
    ratingCount: (row as { ratingCount?: number }).ratingCount ?? 0,
    createdAt: iso(row.createdAt),
    seller: toSeller(row.seller),
    category: toCategory(row.category),
    images: row.images.map((image) => ({
      id: image.id,
      listingId: image.listingId,
      url: image.url,
      sortOrder: image.sortOrder,
    })),
    tasteProfile: row.tasteProfile ? toTaste(row.tasteProfile) : undefined,
    nextRoastDate: (row as { nextRoastDate?: Date | string | null }).nextRoastDate
      ? iso((row as { nextRoastDate?: Date | string | null }).nextRoastDate as Date).slice(0, 10)
      : undefined,
    flavorTags: (row as { flavorTags?: Array<{ tag: string }> }).flavorTags?.map((ft) => ft.tag) ?? [],
  };
}

export function toPayment(row: Prisma.PaymentGetPayload<object>): Payment {
  return {
    id: row.id,
    sellerId: row.sellerId,
    subscriptionId: row.subscriptionId ?? undefined,
    listingId: row.listingId ?? undefined,
    type: row.type,
    amount: num(row.amount),
    status: row.status,
    midtransOrderId: row.midtransOrderId,
    paidAt: row.paidAt ? iso(row.paidAt) : undefined,
    createdAt: iso(row.createdAt),
  };
}

export function toSubscription(row: Prisma.SubscriptionGetPayload<object>): Subscription {
  return {
    id: row.id,
    sellerId: row.sellerId,
    tier: row.tier,
    status: row.status,
    startedAt: iso(row.startedAt),
    expiresAt: iso(row.expiresAt),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

export function toInquiry(row: Prisma.InquiryGetPayload<object>): Inquiry {
  return {
    id: row.id,
    listingId: row.listingId,
    buyerName: row.buyerName,
    buyerContact: row.buyerContact,
    quantity: row.quantity,
    message: row.message,
    createdAt: iso(row.createdAt),
  };
}
