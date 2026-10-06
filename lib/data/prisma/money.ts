import type { DataRepository } from "@/lib/data/contract";
import { getPrisma } from "@/lib/data/prisma/client";
import { toPayment, toSubscription } from "@/lib/data/prisma/mappers";
import { resolvePlanState } from "@/lib/subscription";

const DAY_MS = 86_400_000;
const orderId = (prefix: string, now: number) => `${prefix}-${now}-${crypto.randomUUID().slice(0, 8)}`;

type MoneyMethods = Pick<
  DataRepository,
  "getSellerPayments" | "activateBoost" | "getSellerPlanState" | "startSubscription" | "setCancelAtPeriodEnd"
>;

export const money: MoneyMethods = {
  async getSellerPayments(sellerId) {
    const rows = await getPrisma().payment.findMany({
      where: { sellerId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return rows.map(toPayment);
  },

  async activateBoost(sellerId, listingId, days, amount) {
    const prisma = getPrisma();
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
    if (!listing || listing.sellerId !== sellerId) return null;

    const now = Date.now();
    const payment = await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: { isBoosted: true, boostUntil: new Date(now + days * DAY_MS) },
      });
      return tx.payment.create({
        data: {
          sellerId,
          listingId,
          type: "boost",
          amount,
          status: "paid",
          midtransOrderId: orderId(amount === 0 ? "CREDIT-BOOST" : "MOCK-BOOST", now),
          paidAt: new Date(now),
        },
      });
    });
    return toPayment(payment);
  },

  async getSellerPlanState(sellerId) {
    const rows = await getPrisma().subscription.findMany({ where: { sellerId } });
    return resolvePlanState(rows.map(toSubscription));
  },

  async startSubscription(input) {
    const prisma = getPrisma();
    const seller = await prisma.sellerProfile.findUnique({ where: { id: input.sellerId }, select: { id: true } });
    if (!seller) return null;

    const now = Date.now();
    return prisma.$transaction(async (tx) => {
      const mine = (await tx.subscription.findMany({ where: { sellerId: input.sellerId } })).map(toSubscription);

      let subscription;
      if (input.kind === "renew") {
        const current = resolvePlanState(mine, now).subscription;
        if (!current || current.tier !== input.tier) return null;
        subscription = await tx.subscription.update({
          where: { id: current.id },
          data: { expiresAt: new Date(input.expiresAt), cancelAtPeriodEnd: false },
        });
      } else {
        await tx.subscription.updateMany({
          where: { sellerId: input.sellerId, status: "active" },
          data: { status: "canceled" },
        });
        subscription = await tx.subscription.create({
          data: {
            sellerId: input.sellerId,
            tier: input.tier,
            status: "active",
            startedAt: new Date(now),
            expiresAt: new Date(input.expiresAt),
          },
        });
      }
      await tx.sellerProfile.update({ where: { id: input.sellerId }, data: { tier: input.tier } });

      const payment = await tx.payment.create({
        data: {
          sellerId: input.sellerId,
          subscriptionId: subscription.id,
          type: "subscription",
          amount: input.amount,
          status: "paid",
          midtransOrderId: orderId("MOCK-SUB", now),
          paidAt: new Date(now),
        },
      });
      return { subscription: toSubscription(subscription), payment: toPayment(payment) };
    });
  },

  async setCancelAtPeriodEnd(sellerId, value) {
    const prisma = getPrisma();
    const rows = await prisma.subscription.findMany({ where: { sellerId } });
    const current = resolvePlanState(rows.map(toSubscription)).subscription;
    if (!current) return false;
    await prisma.subscription.update({ where: { id: current.id }, data: { cancelAtPeriodEnd: value } });
    return true;
  },
};
