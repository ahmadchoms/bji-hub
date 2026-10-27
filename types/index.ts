// Core Role Enum
export type Role = "BUYER" | "SELLER" | "ADMIN";

export interface BuyerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  postalCode?: string;
  address: string;
  isPrimary: boolean;
}

// Base Models mirroring Prisma Schema
export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  role: Role;
  suspendedAt?: string | null;
  createdAt: string; // ISO string
  sellerProfile?: SellerProfile | null;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  province: string;
  city: string;
  address: string;
  whatsappNumber: string;
  isVerified: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
  tier: "free" | "growth" | "business";
  bio?: string;
  avatarUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankUpdatedAt?: string | null;
  kycDocumentUrl?: string | null;
  kycSubmittedAt?: string | null;
  suspendedAt?: string | null;
  createdAt: string;
}

export type PayoutStatus = "pending" | "processed" | "rejected";

export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: PayoutStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CoffeeOrigin {
  id: string;
  name: string;
  country: string;
  islandOrState?: string;
  minAltitude?: number;
  maxAltitude?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TasteProfile {
  id: string;
  listingId: string;
  originRegion: string;
  processMethod: "Wash" | "Natural" | "Honey" | "Wet Hulled" | "Anaerobic";
  roastLevel: "Light" | "Medium-Light" | "Medium" | "Medium-Dark" | "Dark";
  flavorNotes: string; // Comma-separated or tag string
  acidityScore: number; // 0 - 5
  bodyScore: number; // 0 - 5
  sweetnessScore?: number; // Optional phase 2 expansion (0 - 5)
  aromaScore?: number; // Optional phase 2 expansion (0 - 5)
  aftertasteScore?: number; // Optional phase 2 expansion (0 - 5)
  cuppingScore?: number; // SCA cupping score (e.g. 84.5)
  roastDate: string;
  cropYear?: string;
  moistureContent?: number;
  altitude?: string;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
}

export interface Listing {
  id: string;
  slug: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description?: string;
  price: number;
  unit: string; // e.g. "kg", "250g", "box", "unit"
  minOrderQty: number;
  stock?: number; // Remaining inventory quantity
  status: "active" | "draft" | "archived" | "suspended";
  isBoosted: boolean;
  boostUntil?: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  sellerId: string;
  tier: "free" | "growth" | "business";
  status: "active" | "past_due" | "canceled";
  startedAt: string;
  expiresAt: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Payment {
  id: string;
  sellerId: string;
  subscriptionId?: string | null;
  listingId?: string | null;
  type: "subscription" | "boost" | "verification";
  amount: number;
  status: "paid" | "pending" | "failed";
  midtransOrderId: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  listingId: string;
  eventType: "impression" | "view" | "contact_click";
  createdAt: string;
}

export interface Inquiry {
  id: string;
  listingId: string;
  buyerName: string;
  buyerContact: string; // Phone/WA/Email
  quantity: string;
  message: string;
  createdAt: string;
}

// Composed & Extended Types
export interface ListingWithRelations extends Listing {
  seller: SellerProfile;
  category: Category;
  tasteProfile?: TasteProfile | null;
  images: ListingImage[];
  inquiries?: Inquiry[];
  events?: AnalyticsEvent[];
}

export interface SellerWithRelations extends SellerProfile {
  user?: User;
  listings: ListingWithRelations[];
  subscriptions?: Subscription[];
  payments?: Payment[];
}

export interface ListingFilters {
  categorySlug?: string;
  originRegion?: string;
  processMethod?: string;
  roastLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  isVerified?: boolean;
  isBoosted?: boolean;
  readyStock?: boolean;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  minCuppingScore?: number;
}

export interface ListingFeedResult {
  items: ListingWithRelations[];
  total: number;
}

export interface FeedItem {
  listing: ListingWithRelations;
  isAd: boolean;
}

export interface CatalogFeedResult {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}

export interface ListingFilterOptions {
  origins: string[];
  processes: string[];
  roastLevels: string[];
}

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  views: number;
  clicks: number;
}

export interface SellerStats {
  totalViews: number;
  totalClicks: number;
  totalImpressions: number;
  conversionRate: number; // percentage (e.g. 5.4)
  totalListings: number;
  activeListings: number;
  inquiryCount: number;
  metrics: DailyMetric[];
}

export interface ListingPerformance {
  listingId: string;
  title: string;
  slug: string;
  views: number;
  clicks: number;
  impressions: number;
  conversionRate: number;
  boostUntil: string | null; // set only while the boost is active
}

export interface AdminStats {
  totalSellers: number;
  totalListings: number;
  pendingVerifications: number;
  monthlyRevenue: number;
  recentPayments: Payment[];
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "completed"
  | "canceled"
  | "disputed";

export interface Order {
  id: string;
  orderNumber: string;
  buyerId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  sellerId: string;
  sellerName?: string;
  listingId: string;
  listingTitle?: string;
  listingSlug?: string;
  quantity: number;
  itemPrice: number;
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  totalAmount: number;
  shippingCourier?: string | null;
  trackingNumber?: string | null;
  status: OrderStatus;
  snapToken?: string | null;
  midtransOrderId?: string | null;
  paymentProvider?: string;
  notes?: string | null;
  disputeReason?: string | null;
  disputeEvidenceUrl?: string | null;
  accessToken?: string | null;
  idempotencyKey?: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  listingId: string;
  title?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  grindSize?: string | null;
}

export interface Review {
  id: string;
  orderId?: string | null;
  listingId: string;
  buyerId?: string | null;
  buyerName: string;
  rating: number; // 1 to 5
  comment?: string | null;
  imageUrl?: string | null;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  isReported?: boolean;
  reportReason?: string | null;
  createdAt: string;
}

