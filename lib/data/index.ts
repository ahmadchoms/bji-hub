import "server-only";

/**
 * The only module pages, actions and route handlers may import data from.
 * Swap these re-exports for the real implementation (Prisma) without touching callers.
 */
export {
  getCategories,
  getCategoryBySlug,
  getCatalogFeed,
  getListings,
  getListingFeed,
  getFilterOptions,
  getListingBySlug,
  getListingById,
  getSellerBySlug,
  getSellerById,
  getSellers,
  getSellerStats,
  getSellerListingPerformance,
  getInquiries,
  submitInquiry as createInquiry,
  getAdminStats,
  getAdminListings,
  getPendingVerifications,
  reviewVerification,
  moderateListing,
  updateListing,
  createListing,
  updateSellerProfile,
  activateBoost,
  getSellerPlanState,
  getSellerPayments,
  startSubscription,
  setCancelAtPeriodEnd,
} from "@/lib/mock/repository";
export {
  createImageUploadTarget,
  storeUploadedImage,
  readStoredImage,
} from "@/lib/mock/storage-store";

export { recordEvent as recordTrackEvent } from "@/lib/mock/analytics-store";
