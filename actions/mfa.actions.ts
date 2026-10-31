"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole, getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";

export interface MfaEnrollResult {
  factorId: string;
  qrCode: string;
  secret: string;
}

export async function enrollMfaAction(): Promise<ActionResult<MfaEnrollResult>> {
  try {
    const session = await requireRole(["admin"], "/admin/mfa/enroll");

    const isMock = process.env.DATA_SOURCE === "mock" || process.env.NODE_ENV === "test";
    if (isMock) {
      return ok({
        factorId: "mock-factor-totp",
        qrCode:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23222'/><text x='10' y='100' fill='%23fff' font-size='14'>Mock MFA QR Code</text></svg>",
        secret: "JBSWY3DPEHPK3PXP",
      });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error || !data || !data.totp) {
      logger.error("mfa.enroll_failed", undefined, {
        userId: session.userId,
        error: error?.message,
      });
      return fail(error?.message || "Gagal menginisialisasi pendaftaran autentikasi dua faktor");
    }

    return ok({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  } catch (err) {
    if ((err as Error)?.message?.includes("NEXT_REDIRECT")) throw err;
    return fail("Terjadi kesalahan sistem saat mendaftarkan MFA");
  }
}

export async function verifyMfaAction(
  code: string,
  factorId?: string
): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin" || !session.userId) {
      return fail("Akses tidak diizinkan");
    }

    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return fail("Kode verifikasi harus berupa 6 digit angka");
    }

    const rateCheck = await checkRateLimit(`mfa:${session.userId}`, 5, 60_000);
    if (!rateCheck.success) {
      return fail("Terlalu banyak percobaan verifikasi. Silakan tunggu 1 menit.");
    }

    const isMock = process.env.DATA_SOURCE === "mock" || process.env.NODE_ENV === "test";
    if (isMock) {
      if (cleanCode === "123456") {
        return ok({ verified: true });
      }
      return fail("Kode verifikasi tidak sesuai (Gunakan 123456 untuk mock)");
    }

    const supabase = await createClient();
    let targetFactorId = factorId;
    if (!targetFactorId) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor =
        factors?.totp?.find((f) => f.status === "verified") || factors?.totp?.[0];
      if (!totpFactor) {
        return fail("Faktor autentikasi tidak ditemukan. Silakan daftar ulang.");
      }
      targetFactorId = totpFactor.id;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: targetFactorId,
      code: cleanCode,
    });

    if (error) {
      logger.warn("mfa.challenge_failed", {
        userId: session.userId,
        error: error.message,
      });
      return fail("Kode verifikasi salah atau kedaluwarsa. Silakan periksa aplikasi authenticator Anda.");
    }

    logger.info("mfa.verified_successfully", { userId: session.userId });
    return ok({ verified: true });
  } catch (err) {
    return fail("Gagal memverifikasi kode autentikasi");
  }
}
