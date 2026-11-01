import { cookies } from "next/headers";
import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { COOKIE_LOCALE, DEFAULT_CURRENCY_RATES, type Locale } from "./index";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get(COOKIE_LOCALE)?.value;
    if (val === "en" || val === "id") return val;
  } catch {
    // outside request lifecycle
  }
  return "id";
}

export async function getCurrencyRate(targetCurrency = "USD"): Promise<number> {
  const target = targetCurrency.toUpperCase();
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT per_idr FROM public.currency_rates WHERE code = $1`,
        [target],
      );
      if (res.rows.length > 0) {
        return Number(res.rows[0].per_idr);
      }
    } catch (e) {
      logger.warn("currency.rate_query_fallback", { error: (e as Error).message, target });
    }
  }
  return DEFAULT_CURRENCY_RATES[target] || DEFAULT_CURRENCY_RATES.USD;
}
