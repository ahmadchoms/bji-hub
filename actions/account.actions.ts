"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession, MOCK_SESSION_COOKIE } from "@/lib/auth/session";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";
import { BUYER_PROFILE_COOKIE } from "@/lib/auth/buyer-profile";
import { validatePasswordStrength } from "@/lib/auth/password-rules";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAfterResponse } from "@/lib/after";
import type { Order } from "@/types";

export async function deleteAccountAction(
  confirmation: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Sesi tidak valid atau Anda belum masuk.");
  }

  if (confirmation.trim().toUpperCase() !== "HAPUS AKUN") {
    return fail("Ketik 'HAPUS AKUN' untuk mengonfirmasi penghapusan akun.");
  }

  const userId = session.userId;
  const anonymizedEmail = `deleted+${userId}@invalid.local`;

  // 1. Guard: Check for any in-progress orders (fail-closed, M6)
  let orders: Order[] = [];
  try {
    orders = await getOrdersByBuyer(userId, session.email ?? undefined);
    const activeOrders = orders.filter((o) =>
      ["pending_payment", "paid", "shipped", "disputed"].includes(o.status),
    );
    if (activeOrders.length > 0) {
      return fail(
        `Tidak dapat menghapus akun karena masih terdapat ${activeOrders.length} pesanan yang sedang berjalan. Harap selesaikan atau batalkan pesanan terlebih dahulu.`,
      );
    }
  } catch (err) {
    logger.error("account.check_orders_failed", err, { userId });
    return fail("Gagal memverifikasi status pesanan akun. Silakan coba beberapa saat lagi.");
  }

  // 1b. Guard: Check for open refunds (pending / manual_required)
  try {
    const { getAllRefunds } = await import("@/lib/data/refunds");
    const allRefunds = await getAllRefunds();
    const buyerOrderIds = new Set(orders.map((o) => o.id));
    const openRefund = allRefunds.find(
      (r) =>
        buyerOrderIds.has(r.orderId) &&
        (r.status === "pending" || r.status === "manual_required"),
    );
    if (openRefund) {
      return fail(
        "Tidak dapat menghapus akun karena masih terdapat pengembalian dana yang sedang diproses.",
      );
    }
  } catch (err) {
    logger.error("account.check_refunds_failed", err, { userId });
    return fail("Gagal memverifikasi status pengembalian dana akun.");
  }

  // 1c. Guard for seller: check active orders, balance, and pending payouts (A4)
  if (session.role === "seller" || session.sellerId) {
    try {
      const { getOrdersBySeller } = await import("@/lib/data/orders");
      const { getSellerBalanceSummary, getPayoutRequestsBySeller } = await import(
        "@/lib/data/payouts"
      );

      let sellerId = session.sellerId;
      if (!sellerId && process.env.DATA_SOURCE !== "mock") {
        const prisma = getPrisma();
        const profile = await prisma.sellerProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        sellerId = profile?.id ?? null;
      }

      if (sellerId) {
        const sellerOrders = await getOrdersBySeller(sellerId);
        const activeSellerOrders = sellerOrders.filter((o: Order) =>
          ["pending_payment", "paid", "shipped", "disputed"].includes(o.status),
        );
        if (activeSellerOrders.length > 0) {
          return fail(
            `Tidak dapat menghapus akun karena toko Anda masih memiliki ${activeSellerOrders.length} pesanan aktif.`,
          );
        }

        const summary = await getSellerBalanceSummary(sellerId);
        const totalBalance = summary.availableBalance + summary.pendingBalance;
        if (totalBalance > 0) {
          return fail(
            `Tidak dapat menghapus akun karena masih terdapat saldo toko sebesar Rp ${totalBalance.toLocaleString("id-ID")}. Silakan lakukan penarikan dana terlebih dahulu.`,
          );
        }

        const payouts = await getPayoutRequestsBySeller(sellerId);
        const pendingPayouts = payouts.filter(
          (p: { status: string }) => p.status === "pending",
        );
        if (pendingPayouts.length > 0) {
          return fail(
            "Tidak dapat menghapus akun karena masih terdapat pengajuan pencairan dana yang sedang diproses.",
          );
        }
      }
    } catch (err) {
      logger.error("account.check_seller_status_failed", err, { userId });
      return fail("Gagal memverifikasi status toko Anda.");
    }
  }

  // 2. Anonymize user personal data in database (fail-closed, M6)
  if (process.env.DATA_SOURCE !== "mock") {
    try {
      const prisma = getPrisma();
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            email: anonymizedEmail,
            passwordHash: null,
            suspendedAt: new Date(),
            addresses: {
              deleteMany: {},
            },
          },
        });

        // Anonymize historical buyer PII on completed/canceled orders
        await tx.order.updateMany({
          where: { buyerId: userId },
          data: {
            buyerName: "Pengguna Terhapus",
            buyerEmail: anonymizedEmail,
            buyerPhone: "080000000000",
            buyerAddress: "Dianonimkan",
            buyerCity: "Dianonimkan",
          },
        });

        // If seller profile exists, archive listings and clear KYC
        const seller = await tx.sellerProfile.findUnique({
          where: { userId },
        });
        if (seller) {
          await tx.listing.updateMany({
            where: { sellerId: seller.id },
            data: { status: "archived" },
          });
          await tx.sellerProfile.update({
            where: { id: seller.id },
            data: {
              kycDocumentUrl: null,
              suspendedAt: new Date(),
            },
          });
        }
      });
    } catch (err) {
      logger.error("account.anonymize_db_failed", err, { userId });
      return fail("Gagal memproses penghapusan data akun di database.");
    }
  }

  // 3. Supabase Auth user deletion with service role (fail-closed, M6)
  if (
    process.env.DATA_SOURCE !== "mock" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabaseAdmin = createAdminClient();
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
          logger.error("account.supabase_delete_user_failed", error, { userId });
          return fail("Gagal menghapus kredensial autentikasi. Silakan hubungi dukungan.");
        }
      }
    } catch (err) {
      logger.error("account.supabase_admin_failed", err, { userId });
      return fail("Gagal menghubungi server autentikasi untuk menghapus akun.");
    }
  }

  // 4. Log compliance audit event (without PII)
  try {
    await recordAuditLog({
      actorId: userId,
      actorRole: session.role,
      action: "account_deletion",
      targetId: userId,
      targetType: "user",
      details: "Pengguna meminta penghapusan akun dan anonimisasi data pribadi sesuai UU PDP.",
    });
  } catch (err) {
    logger.warn("account.audit_log_failed", { userId, error: String(err) });
  }

  // 5. Clear all session cookies
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
  cookieStore.delete(BUYER_PROFILE_COOKIE);

  return ok({ redirectTo: "/login?deleted=1" });
}

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
});

export async function changePasswordFromProfileAction(
  input: unknown,
): Promise<ActionResult<{ message: string }>> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId || !session.email) {
    return fail("Sesi tidak valid atau Anda belum masuk.");
  }

  // M11: Rate limit password verification to prevent brute force on stolen sessions
  const rate = await checkRateLimit("pwd_change:" + session.userId, 5, 15 * 60_000);
  if (!rate.success) {
    return fail("Terlalu banyak percobaan ganti kata sandi. Silakan tunggu 15 menit.");
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "Input tidak valid");
  }

  const strength = validatePasswordStrength(parsed.data.newPassword);
  if (!strength.valid) {
    return fail(strength.error || "Kata sandi baru tidak memenuhi syarat keamanan");
  }

  if (
    process.env.DATA_SOURCE !== "mock" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: parsed.data.oldPassword,
      });
      if (signInErr) {
        return fail("Kata sandi saat ini salah.");
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });
      if (updateErr) {
        return fail(updateErr.message || "Gagal memperbarui kata sandi.");
      }

      // S8: Revoke all other active sessions across other devices
      await supabase.auth.signOut({ scope: "others" });
    } catch (err) {
      logger.error("account.change_password_failed", { error: String(err) });
      return fail("Gagal memperbarui kata sandi. Silakan coba lagi.");
    }
  }

  const actorId = session.userId;
  const actorRole = session.role || "buyer";
  runAfterResponse(async () => {
    if (actorId) {
      await recordAuditLog({
        actorId,
        actorRole,
        action: "change_password",
        targetId: actorId,
        targetType: "user",
        details: "Perubahan kata sandi dari profil; sesi di perangkat lain dicabut otomatis (S8).",
      }).catch(() => {});
    }
  });

  return ok({
    message: "Kata sandi berhasil diperbarui dan seluruh perangkat lain telah dikeluarkan demi keamanan.",
  });
}

export async function signOutAllDevicesAction(): Promise<
  ActionResult<{ redirectTo: string }>
> {
  const session = await getSession();
  if (session.role === "guest" || !session.userId) {
    return fail("Sesi tidak valid.");
  }

  if (
    process.env.DATA_SOURCE !== "mock" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut({ scope: "global" });
    } catch (err) {
      logger.warn("account.signout_all_failed", { error: String(err) });
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
  cookieStore.delete(BUYER_PROFILE_COOKIE);

  return ok({ redirectTo: "/login?message=logged_out_all" });
}
