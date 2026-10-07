import "server-only";

import type { DataRepository } from "@/lib/data/contract";
import { mockRepository } from "@/lib/data/mock";
import { prismaRepository } from "@/lib/data/prisma";

/**
 * The only module pages, actions and route handlers may import data from.
 * DATA_SOURCE=prisma uses the database; anything else uses the in-memory mock.
 */
const repository: DataRepository = process.env.DATA_SOURCE === "prisma" ? prismaRepository : mockRepository;

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
