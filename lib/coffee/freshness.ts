export type RoastLevel =
  | "Light"
  | "Medium-Light"
  | "Medium"
  | "Medium-Dark"
  | "Dark";

export type FreshnessState = "resting" | "optimal" | "good" | "past_peak";

/** Jendela kesegaran ideal per tingkat sangrai (dalam hari) */
export const FRESHNESS_WINDOWS: Record<
  RoastLevel,
  { restDays: number; peakEndDays: number; goodEndDays: number }
> = {
  Light: { restDays: 5, peakEndDays: 21, goodEndDays: 35 },
  "Medium-Light": { restDays: 4, peakEndDays: 18, goodEndDays: 32 },
  Medium: { restDays: 3, peakEndDays: 16, goodEndDays: 30 },
  "Medium-Dark": { restDays: 2, peakEndDays: 14, goodEndDays: 28 },
  Dark: { restDays: 2, peakEndDays: 12, goodEndDays: 24 },
};

const DAY_MS = 86_400_000;
const THREE_YEARS_MS = 3 * 365 * DAY_MS;

/**
 * Parses date string or Date object with WIB (Asia/Jakarta, UTC+7) consideration.
 */
export function parseWibRoastDate(
  roastDate: Date | string | null | undefined
): Date | null {
  if (!roastDate) return null;
  if (roastDate instanceof Date) {
    return isNaN(roastDate.getTime()) ? null : roastDate;
  }
  const trimmed = String(roastDate).trim();
  if (!trimmed) return null;

  // If in YYYY-MM-DD format, anchor to start of day in WIB (+07:00)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00+07:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Menghitung selisih hari sejak tanggal sangrai dalam zona WIB.
 * Mengembalikan null jika tanggal tidak valid, di masa depan > 1 hari, atau > 3 tahun lalu.
 */
export function daysSinceRoast(
  roastDate: Date | string | null | undefined,
  now: Date = new Date()
): number | null {
  const d = parseWibRoastDate(roastDate);
  if (!d) return null;

  const diffMs = now.getTime() - d.getTime();

  // Lebih dari 1 hari di masa depan -> invalid
  if (diffMs < -DAY_MS) return null;

  // Dalam rentang toleransi 1 hari ke depan (beda jam/zona) -> anggap 0 hari (hari ini)
  if (diffMs < 0) return 0;

  // Lebih dari 3 tahun lalu -> invalid/stale data
  if (diffMs > THREE_YEARS_MS) return null;

  return Math.floor(diffMs / DAY_MS);
}

export function getFreshness(
  roastDate: Date | string | null | undefined,
  level: RoastLevel | string = "Medium",
  now: Date = new Date()
): {
  days: number;
  state: FreshnessState;
  label: string;
  badgeText: string;
  restDaysNeeded?: number;
} | null {
  const days = daysSinceRoast(roastDate, now);
  if (days === null) return null;

  const normalizedLevel: RoastLevel =
    level in FRESHNESS_WINDOWS ? (level as RoastLevel) : "Medium";
  const w = FRESHNESS_WINDOWS[normalizedLevel];

  let state: FreshnessState;
  let label: string;
  let restDaysNeeded: number | undefined;

  if (days < w.restDays) {
    state = "resting";
    restDaysNeeded = w.restDays - days;
    label = `Masa istirahat (${restDaysNeeded} hari lagi)`;
  } else if (days <= w.peakEndDays) {
    state = "optimal";
    label = "Optimal (Rasa Puncak)";
  } else if (days <= w.goodEndDays) {
    state = "good";
    label = "Baik untuk Diseduh";
  } else {
    state = "past_peak";
    label = "Lewat Masa Puncak";
  }

  const badgeText = `Sangrai ${days} hari lalu • ${label}`;

  return { days, state, label, badgeText, restDaysNeeded };
}
