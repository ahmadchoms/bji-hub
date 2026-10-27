"use server";

import { cookies } from "next/headers";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getSession, MOCK_SESSION_COOKIE } from "@/lib/auth/session";
import { getOrdersByBuyer } from "@/lib/data/orders";
import { recordAuditLog } from "@/lib/data/audit-logs";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { logger } from "@/lib/logger";
import { BUYER_PROFILE_COOKIE } from "@/lib/auth/buyer-profile";

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

  // 1. Guard: Check for any in-progress orders (UU PDP allows retention of financial records, but open transactions must be closed first)
  try {
    const orders = await getOrdersByBuyer(userId, session.email ?? undefined);
    const activeOrders = orders.filter((o) =>
      ["pending_payment", "paid", "processing", "shipped"].includes(o.status),
    );
    if (activeOrders.length > 0) {
      return fail(
        `Tidak dapat menghapus akun karena masih terdapat ${activeOrders.length} pesanan yang sedang berjalan. Harap selesaikan atau batalkan pesanan terlebih dahulu.`,
      );
    }
  } catch (err) {
    logger.error("account.check_orders_failed", err, { userId });
  }

  // 2. Anonymize user personal data in database
  if (process.env.DATA_SOURCE !== "mock") {
    try {
      const prisma = getPrisma();
      const anonymizedEmail = `anonymized_${userId.slice(0, 8)}@deleted.bijihub.com`;
      await prisma.user.update({
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
    } catch (err) {
      logger.error("account.anonymize_db_failed", err, { userId });
      // Non-fatal if table doesn't have the user row yet (e.g. Supabase-only user)
    }
  }

  // 3. Log compliance audit event
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

  // 4. Supabase Auth cleanup / global session revocation
  if (
    process.env.DATA_SOURCE !== "mock" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // ignore: best-effort session signout
    }
  }

  // 5. Clear all session cookies
  const cookieStore = await cookies();
  cookieStore.delete(MOCK_SESSION_COOKIE);
  cookieStore.delete(BUYER_PROFILE_COOKIE);

  return ok({ redirectTo: "/login?deleted=1" });
}
