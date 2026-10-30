import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  Category,
  Inquiry,
  ListingWithRelations,
  Payment,
  Producer,
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
  tasteProfile: {
    include: {
      producer: true,
    },
  },
  flavorTags: true,
} satisfies Prisma.ListingInclude;

export type ListingRow = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;
type SellerRow = Prisma.SellerProfileGetPayload<object>;
type TasteRow = Prisma.TasteProfileGetPayload<{ include: { producer: true } }>;

export function toCategory(row: Prisma.CategoryGetPayload<object>): Category {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description ?? undefined };
}

export function toProducer(row: Prisma.ProducerGetPayload<object>): Producer {
  const producer: Producer = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind as Producer["kind"],
    certifications: row.certifications,
    photoUrls: row.photoUrls,
    createdAt: iso(row.createdAt),
  };
  if (row.originId) producer.originId = row.originId;
  if (row.village) producer.village = row.village;
  if (row.province) producer.province = row.province;
  if (row.altitudeMin != null) producer.altitudeMin = row.altitudeMin;
  if (row.altitudeMax != null) producer.altitudeMax = row.altitudeMax;
  if (row.farmersCount != null) producer.farmersCount = row.farmersCount;
  if (row.story) producer.story = row.story;
  if (row.claimsVerifiedAt) producer.claimsVerifiedAt = iso(row.claimsVerifiedAt);
  return producer;
}

export function toSeller(row: SellerRow): SellerProfile {
  const seller: SellerProfile = {
    id: row.id,
    userId: row.userId,
    businessName: row.businessName,
    slug: row.slug,
    province: row.province,
    city: row.city,
    address: row.address,
    whatsappNumber: row.whatsappNumber,
    isVerified: row.isVerified,
    tier: row.tier,
    createdAt: iso(row.createdAt),
  };
  if (row.bio) seller.bio = row.bio;
  if (row.avatarUrl) seller.avatarUrl = row.avatarUrl;
  const raw = row as Record<string, unknown>;
  const bankName = raw.bankName || raw.bank_name;
  if (bankName) seller.bankName = bankName as string;
  const bankAcc = raw.bankAccountNumber || raw.bank_account_number;
  if (bankAcc) seller.bankAccountNumber = bankAcc as string;
  const bankHolder = raw.bankAccountHolder || raw.bank_account_holder;
  if (bankHolder) seller.bankAccountHolder = bankHolder as string;
  if (raw.bankUpdatedAt) seller.bankUpdatedAt = iso(raw.bankUpdatedAt as Date);
  const kycDoc = raw.kycDocumentUrl || raw.kyc_document_url;
  if (kycDoc) seller.kycDocumentUrl = kycDoc as string;
  if (raw.kycSubmittedAt) seller.kycSubmittedAt = iso(raw.kycSubmittedAt as Date);
  return seller;
}

export function toTaste(row: TasteRow): TasteProfile {
  const taste: TasteProfile = {
    id: row.id,
    listingId: row.listingId,
    originRegion: row.originRegion,
    processMethod: row.processMethod as TasteProfile["processMethod"],
    roastLevel: row.roastLevel as TasteProfile["roastLevel"],
    flavorNotes: row.flavorNotes,
    acidityScore: num(row.acidityScore),
    bodyScore: num(row.bodyScore),
    roastDate: iso(row.roastDate),
  };
  const sweetness = numOrUndef(row.sweetnessScore);
  if (sweetness !== undefined) taste.sweetnessScore = sweetness;
  const aroma = numOrUndef(row.aromaScore);
  if (aroma !== undefined) taste.aromaScore = aroma;
  const aftertaste = numOrUndef(row.aftertasteScore);
  if (aftertaste !== undefined) taste.aftertasteScore = aftertaste;
  const cupping = numOrUndef(row.cuppingScore);
  if (cupping !== undefined) taste.cuppingScore = cupping;
  if (row.cropYear) taste.cropYear = row.cropYear;
  const moisture = numOrUndef(row.moistureContent);
  if (moisture !== undefined) taste.moistureContent = moisture;
  if (row.altitude) taste.altitude = row.altitude;

  const raw = row as Record<string, unknown>;
  const producer = (row.producer || raw.producer) as Prisma.ProducerGetPayload<object> | null | undefined;
  if (producer) taste.producer = toProducer(producer);
  const producerId = (raw.producerId || raw.producer_id) as string | undefined;
  if (producerId) taste.producerId = producerId;
  const lotCode = (raw.lotCode || raw.lot_code) as string | undefined;
  if (lotCode) taste.lotCode = lotCode;
  const varieties = (row.varieties || raw.varieties) as string[] | undefined;
  if (varieties && varieties.length > 0) taste.varieties = varieties;
  const harvestMonth = (raw.harvestMonth ?? raw.harvest_month) as number | undefined;
  if (harvestMonth != null) taste.harvestMonth = harvestMonth;
  const fermentationHours = (raw.fermentationHours ?? raw.fermentation_hours) as number | undefined;
  if (fermentationHours != null) taste.fermentationHours = fermentationHours;
  const dryingDays = (raw.dryingDays ?? raw.drying_days) as number | undefined;
  if (dryingDays != null) taste.dryingDays = dryingDays;

  return taste;
}

export function toListing(row: ListingRow): ListingWithRelations {
  const listing: ListingWithRelations = {
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
  };
  if (row.tasteProfile) listing.tasteProfile = toTaste(row.tasteProfile);
  const nextRoastDate = (row as { nextRoastDate?: Date | string | null }).nextRoastDate;
  if (nextRoastDate) listing.nextRoastDate = iso(nextRoastDate as Date).slice(0, 10);
  const flavorTags = (row as { flavorTags?: Array<{ tag: string }> }).flavorTags;
  if (flavorTags && flavorTags.length > 0) listing.flavorTags = flavorTags.map((ft) => ft.tag);
  return listing;
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
