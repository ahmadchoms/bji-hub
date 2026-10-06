import type {
  CatalogFeedResult,
  Category,
  AdminStats,
  Inquiry,
  ListingFeedResult,
  ListingFilterOptions,
  ListingFilters,
  ListingPerformance,
  ListingWithRelations,
  Payment,
  SellerProfile,
  SellerStats,
  SellerWithRelations,
  Subscription,
} from "@/types";
import type { PlanTier } from "@/lib/plans";
import type { PlanState } from "@/lib/subscription";
import type { TrackPayload } from "@/lib/validations/track.schema";
import type { ListingFormValues } from "@/lib/validations/listing.schema";
import type { SellerProfileFormValues } from "@/lib/validations/seller-profile.schema";

export type RecordResult = "recorded" | "duplicate" | "ignored" | "rate_limited";

export interface InquiryInput {
  listingId: string;
  buyerName: string;
  buyerContact: string;
  quantity: string;
  message: string;
}

export interface StartSubscriptionInput {
  sellerId: string;
  tier: Exclude<PlanTier, "free">;
  kind: "new" | "renew" | "upgrade";
  expiresAt: string;
  amount: number;
}

type Paged = ListingFilters & { page?: number; pageSize?: number };

/** Everything the app may ask of the data layer. The mock and Prisma implementations must both satisfy it. */
export interface DataRepository {
  // catalog
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  getListings(filters?: Paged): Promise<ListingFeedResult>;
  getListingFeed(filters?: Paged): Promise<ListingFeedResult>;
  getCatalogFeed(filters: ListingFilters, upToPage: number): Promise<CatalogFeedResult>;
  getFilterOptions(): Promise<ListingFilterOptions>;
  getListingBySlug(slug: string): Promise<ListingWithRelations | null>;
  getListingById(id: string): Promise<ListingWithRelations | null>;

  // sellers
  getSellerBySlug(slug: string): Promise<SellerWithRelations | null>;
  getSellerById(id: string): Promise<SellerWithRelations | null>;
  getSellers(): Promise<SellerProfile[]>;
  getSellerStats(sellerId: string): Promise<SellerStats>;
  getSellerListingPerformance(sellerId: string): Promise<ListingPerformance[]>;
  getInquiries(sellerId?: string): Promise<Inquiry[]>;
  createInquiry(input: InquiryInput): Promise<Inquiry>;
  updateSellerProfile(sellerId: string, data: SellerProfileFormValues): Promise<SellerProfile | null>;
  createListing(sellerId: string, data: ListingFormValues): Promise<ListingWithRelations | null>;
  updateListing(sellerId: string, listingId: string, data: ListingFormValues): Promise<ListingWithRelations | null>;

  // money
  getSellerPayments(sellerId: string): Promise<Payment[]>;
  activateBoost(sellerId: string, listingId: string, days: number, amount: number): Promise<Payment | null>;
  getSellerPlanState(sellerId: string): Promise<PlanState>;
  startSubscription(input: StartSubscriptionInput): Promise<{ subscription: Subscription; payment: Payment } | null>;
  setCancelAtPeriodEnd(sellerId: string, value: boolean): Promise<boolean>;

  // admin
  getAdminStats(): Promise<AdminStats>;
  getAdminListings(): Promise<ListingWithRelations[]>;
  getPendingVerifications(): Promise<SellerProfile[]>;
  reviewVerification(sellerId: string, decision: "approve" | "reject"): Promise<boolean>;
  moderateListing(listingId: string, decision: "approve" | "suspend"): Promise<boolean>;

  // analytics
  recordTrackEvent(payload: TrackPayload): Promise<RecordResult>;
}
