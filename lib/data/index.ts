import "server-only";

import type { DataRepository } from "@/lib/data/contract";
import { mockRepository } from "@/lib/data/mock";
import { prismaRepository } from "@/lib/data/prisma";

/**
 * The only module pages, actions and route handlers may import data from.
 * Defaults directly to Supabase Prisma repository.
 */
const repository: DataRepository =
  process.env.DATA_SOURCE === "mock" ? mockRepository : prismaRepository;

export const {
  getCategories,
  getCategoryBySlug,
  getListings,
  getListingFeed,
  getCatalogFeed,
  getFilterOptions,
  getListingBySlug,
  getListingById,
  getSellerBySlug,
  getSellerById,
  getSellers,
  getSellerStats,
  getSellerListingPerformance,
  getInquiries,
  createInquiry,
  updateSellerProfile,
  requestVerification,
  createListing,
  updateListing,
  getSellerPayments,
  activateBoost,
  getSellerPlanState,
  startSubscription,
  setCancelAtPeriodEnd,
  getAdminStats,
  getAdminListings,
  getPendingVerifications,
  reviewVerification,
  moderateListing,
  recordTrackEvent,
} = repository;

// File storage stays on the mock until Supabase Storage is connected.
export { createImageUploadTarget, storeUploadedImage, readStoredImage } from "@/lib/mock/storage-store";

// Coffee Origins & Traceable Producers (COF-2)
export {
  getCoffeeOrigins,
  getCoffeeOriginBySlug,
  getCoffeeOriginById,
  toOriginSlug,
} from "@/lib/data/origins";

export {
  getProducers,
  getProducerBySlug,
  getProducerById,
} from "@/lib/data/producers";
