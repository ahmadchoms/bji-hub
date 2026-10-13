"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { requireSeller } from "@/lib/auth/session";
import { getPlan, planTotal, type PlanTier } from "@/lib/plans";
import { decidePlanChange } from "@/lib/subscription";
import { subscribeSchema } from "@/lib/validations/subscription.schema";
import {
  getSellerPlanState,
  setCancelAtPeriodEnd,
  startSubscription,
} from "@/lib/data";
import type { Payment } from "@/types";

function refresh() {
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/pricing");
}

export async function subscribePlanAction(input: unknown): Promise<
  ActionResult<{
    paymentId: string;
    status: Payment["status"];
    tier: PlanTier;
    expiresAt: string;
    snapToken?: string | null;
  }>
> {
  const { sellerId } = await requireSeller("/dashboard/billing");
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return fail("Pilihan paket tidak valid");

  const state = await getSellerPlanState(sellerId);
  const decision = decidePlanChange(
    state,
    parsed.data.tier,
    parsed.data.months,
  );
  if (!decision.ok) return fail(decision.reason);

  const amount = planTotal(getPlan(parsed.data.tier), parsed.data.months);
  const result = await startSubscription({
    sellerId,
    tier: parsed.data.tier,
    kind: decision.kind,
    expiresAt: decision.expiresAt,
    amount,
  });
  if (!result) return fail("Gagal memproses langganan");

  let snapToken: string | null = null;
  if (amount > 0 && process.env.MIDTRANS_SERVER_KEY) {
    const { createMidtransSnapToken } = await import("@/lib/midtrans");
    snapToken = await createMidtransSnapToken({
      orderId: result.payment.midtransOrderId,
      grossAmount: amount,
    });
  }

  refresh();
  return ok({
    paymentId: result.payment.id,
    status: result.payment.status,
    tier: result.subscription.tier,
    expiresAt: result.subscription.expiresAt,
    snapToken,
  });
}

export async function cancelPlanAction(): Promise<
  ActionResult<{ expiresAt: string }>
> {
  const { sellerId } = await requireSeller("/dashboard/billing");
  const state = await getSellerPlanState(sellerId);
  if (state.tier === "free" || !state.expiresAt)
    return fail("Tidak ada langganan berbayar yang aktif");
  if (state.cancelAtPeriodEnd)
    return fail("Langganan sudah dijadwalkan berakhir");

  if (!(await setCancelAtPeriodEnd(sellerId, true)))
    return fail("Gagal menghentikan langganan");
  refresh();
  return ok({ expiresAt: state.expiresAt });
}

export async function resumePlanAction(): Promise<
  ActionResult<{ expiresAt: string }>
> {
  const { sellerId } = await requireSeller("/dashboard/billing");
  const state = await getSellerPlanState(sellerId);
  if (!state.cancelAtPeriodEnd || !state.expiresAt)
    return fail("Tidak ada pembatalan yang bisa dibatalkan");

  if (!(await setCancelAtPeriodEnd(sellerId, false)))
    return fail("Gagal memulihkan langganan");
  refresh();
  return ok({ expiresAt: state.expiresAt });
}

export async function syncPaymentStatusAction(
  orderId: string
): Promise<ActionResult<{ status: Payment["status"]; message: string }>> {
  await requireSeller("/dashboard/billing");
  if (!orderId) return fail("ID Order tidak valid");

  const { checkMidtransStatus, mapMidtransStatus } = await import(
    "@/lib/midtrans"
  );
  const midtransRes = await checkMidtransStatus(orderId);

  if (!midtransRes) {
    return fail(
      "Transaksi belum ditemukan di Midtrans atau Server Key belum dikonfigurasi."
    );
  }

  const nextStatus = mapMidtransStatus(
    midtransRes.transactionStatus,
    midtransRes.fraudStatus
  );

  if (process.env.DATA_SOURCE === "prisma") {
    const { getPrisma } = await import("@/lib/data/prisma/client");
    const prisma = getPrisma();
    const payment = await prisma.payment.findUnique({
      where: { midtransOrderId: orderId },
    });

    if (payment && payment.status !== nextStatus) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: nextStatus,
            paidAt: nextStatus === "paid" ? new Date() : null,
          },
        });

        if (nextStatus === "paid" && payment.subscriptionId) {
          await tx.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "active" },
          });
        }

        if (
          nextStatus === "paid" &&
          payment.listingId &&
          payment.type === "boost"
        ) {
          await tx.listing.update({
            where: { id: payment.listingId },
            data: { isBoosted: true },
          });
        }
      });
    }
  }

  refresh();
  const message =
    nextStatus === "paid"
      ? "Pembayaran berhasil dan telah terverifikasi!"
      : nextStatus === "failed"
        ? "Pembayaran telah dibatalkan atau kedaluwarsa."
        : "Status masih menunggu pembayaran di Midtrans.";

  return ok({ status: nextStatus, message });
}

