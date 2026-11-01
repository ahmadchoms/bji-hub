"use server";

import { getPool } from "@/lib/db/pool";
import { getSession } from "@/lib/auth/session";
import { isAdminAllowed } from "@/lib/auth/admin-guard";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { DEFAULT_CURRENCY_RATES } from "@/lib/i18n";
import { assertMockAllowed } from "@/lib/data/mock-guard";

export interface CurrencyRateItem {
  code: string;
  perIdr: number;
  updatedAt: string;
}

const mockCurrencyRates: Map<string, CurrencyRateItem> = new Map(
  Object.entries(DEFAULT_CURRENCY_RATES).map(([code, perIdr]) => [
    code,
    { code, perIdr, updatedAt: new Date().toISOString() },
  ])
);

export async function getCurrencyRatesAction(): Promise<
  ActionResult<{ rates: CurrencyRateItem[] }>
> {
  const session = await getSession();
  if (!(await isAdminAllowed(session))) {
    return fail("Akses admin ditolak atau verifikasi MFA diperlukan");
  }

  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT code, per_idr, updated_at FROM public.currency_rates ORDER BY code ASC`
      );
      const rates: CurrencyRateItem[] = res.rows.map((r) => ({
        code: r.code,
        perIdr: Number(r.per_idr),
        updatedAt: new Date(r.updated_at).toISOString(),
      }));
      return ok({ rates });
    } catch (err) {
      logger.error(
        "currency.get_rates_failed",
        err instanceof Error ? err : new Error(String(err))
      );
      return fail("Gagal memuat kurs mata uang");
    }
  }

  assertMockAllowed("getCurrencyRatesAction");
  return ok({ rates: Array.from(mockCurrencyRates.values()) });
}

export async function updateCurrencyRateAction(
  code: string,
  perIdr: number
): Promise<ActionResult<{ success: true }>> {
  const session = await getSession();
  if (!(await isAdminAllowed(session))) {
    return fail("Akses admin ditolak atau verifikasi MFA diperlukan");
  }

  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 2 || cleanCode.length > 5) {
    return fail("Kode mata uang tidak valid (2-5 karakter)");
  }

  if (typeof perIdr !== "number" || isNaN(perIdr) || perIdr <= 0) {
    return fail("Nilai kurs per IDR harus angka positif lebih dari 0");
  }

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.currency_rates (code, per_idr, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (code)
         DO UPDATE SET per_idr = EXCLUDED.per_idr, updated_at = NOW()`,
        [cleanCode, perIdr]
      );
      try {
        revalidatePath("/admin/maintenance");
      } catch {
        // ignore: revalidate outside request lifecycle
      }
      return ok({ success: true });
    } catch (err) {
      logger.error(
        "currency.update_rate_failed",
        err instanceof Error ? err : new Error(String(err))
      );
      return fail("Gagal memperbarui nilai kurs mata uang");
    }
  }

  assertMockAllowed("updateCurrencyRateAction");
  mockCurrencyRates.set(cleanCode, {
    code: cleanCode,
    perIdr,
    updatedAt: new Date().toISOString(),
  });
  try {
    revalidatePath("/admin/maintenance");
  } catch {
    // ignore: revalidate outside request lifecycle
  }
  return ok({ success: true });
}
