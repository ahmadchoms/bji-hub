import type { DataRepository } from "@/lib/data/contract";
import { getPrisma } from "@/lib/data/prisma/client";
import { listingInclude, toListing, toPayment, toSeller } from "@/lib/data/prisma/mappers";

type AdminMethods = Pick<
  DataRepository,
  "getAdminStats" | "getAdminListings" | "getPendingVerifications" | "reviewVerification" | "moderateListing"
>;

export const admin: AdminMethods = {
  async getAdminStats() {
    const prisma = getPrisma();
    const [totalSellers, totalListings, pendingVerifications, revenue, recent] = await Promise.all([
      prisma.sellerProfile.count(),
      prisma.listing.count(),
      prisma.sellerProfile.count({ where: { isVerified: false, verificationStatus: "pending" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
      prisma.payment.findMany({ orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 50 }),
    ]);

    return {
      totalSellers,
      totalListings,
      pendingVerifications,
      monthlyRevenue: revenue._sum.amount ? revenue._sum.amount.toNumber() : 0,
      recentPayments: recent.map(toPayment),
    };
  },

  async getAdminListings() {
    const rows = await getPrisma().listing.findMany({
      include: listingInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return rows.map(toListing);
  },

  async getPendingVerifications() {
    const rows = await getPrisma().sellerProfile.findMany({
      where: { isVerified: false, verificationStatus: "pending" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toSeller);
  },

  async reviewVerification(sellerId, decision) {
    const result = await getPrisma().sellerProfile.updateMany({
      where: { id: sellerId },
      data:
        decision === "approve"
          ? { isVerified: true, verificationStatus: "approved" }
          : { verificationStatus: "rejected" },
    });
    return result.count > 0;
  },

  async moderateListing(listingId, decision) {
    const result = await getPrisma().listing.updateMany({
      where: { id: listingId },
      data: { status: decision === "approve" ? "active" : "suspended" },
    });
    return result.count > 0;
  },
};
