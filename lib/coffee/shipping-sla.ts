import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export interface RoastToShipSlaResult {
  medianDays: number | null;
  qualifiesForSlaBadge: boolean;
  samplesCount: number;
  isMockData?: boolean;
}

export function computeMedian(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid] ?? null;
  }
  const low = sorted[mid - 1] ?? 0;
  const high = sorted[mid] ?? 0;
  return Number(((low + high) / 2).toFixed(1));
}

/**
 * Calculates the median days between roast date snapshot and shipped_at for a given seller (F4).
 * Qualifies for the "Dikirim ≤ 3 hari setelah sangrai" badge if median <= 3 days AND >= 5 shipments in 90 days.
 */
export async function calculateRoastToShipSla(
  sellerId: string
): Promise<RoastToShipSlaResult> {
  const isProd = process.env.NODE_ENV === "production";
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT (o.shipped_at::date - o.roast_date_at_ship) AS days_diff
         FROM public.orders o
         WHERE o.seller_id = $1
           AND o.shipped_at IS NOT NULL
           AND o.roast_date_at_ship IS NOT NULL
           AND o.shipped_at >= NOW() - INTERVAL '90 days'
           AND (o.shipped_at::date - o.roast_date_at_ship) BETWEEN 0 AND 60`,
        [sellerId]
      );

      const daysDiffs: number[] = res.rows
        .map((r) => Number(r.days_diff))
        .filter((d) => !Number.isNaN(d) && d >= 0);

      const median = computeMedian(daysDiffs);
      const qualifies = median !== null && median <= 3 && daysDiffs.length >= 5;

      return {
        medianDays: median,
        qualifiesForSlaBadge: qualifies,
        samplesCount: daysDiffs.length,
      };
    } catch (error) {
      if (isProd) {
        logger.error("shipping_sla.db_query_failed", error);
        return {
          medianDays: null,
          qualifiesForSlaBadge: false,
          samplesCount: 0,
        };
      }
      // In dev/test: fall through to mock fixture when table/column is unmigrated
    }
  }

  // Never return fake data in production
  if (isProd) {
    return {
      medianDays: null,
      qualifiesForSlaBadge: false,
      samplesCount: 0,
    };
  }

  // Dev/Test Mock Mode fixture (isMockData: true)
  const isDedicatedFreshRoaster = sellerId === "seller-1" || sellerId === "seller-2";
  const mockDays = isDedicatedFreshRoaster ? [1, 2, 2, 3, 2] : [4, 5, 6, 7];
  const median = computeMedian(mockDays);

  return {
    medianDays: median,
    qualifiesForSlaBadge: Boolean(median && median <= 3 && mockDays.length >= 5),
    samplesCount: mockDays.length,
    isMockData: true,
  };
}
