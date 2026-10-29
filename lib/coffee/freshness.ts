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

export function daysSinceRoast(
  roastDate: Date | string,
  now: Date = new Date()
): number {
  const d = typeof roastDate === "string" ? new Date(roastDate) : roastDate;
  if (isNaN(d.getTime())) return 0;
  const ms = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function getFreshness(
  roastDate: Date | string,
  level: RoastLevel | string = "Medium",
  now: Date = new Date()
): {
  days: number;
  state: FreshnessState;
  label: string;
  badgeText: string;
  restDaysNeeded?: number;
} {
  const days = daysSinceRoast(roastDate, now);
  const normalizedLevel: RoastLevel =
    level in FRESHNESS_WINDOWS ? (level as RoastLevel) : "Medium";
  const w = FRESHNESS_WINDOWS[normalizedLevel];

  let state: FreshnessState;
  let label: string;
  let restDaysNeeded: number | undefined;

  if (days < w.restDays) {
    state = "resting";
    restDaysNeeded = w.restDays - days;
    label = `Degassing (${restDaysNeeded} hari lagi)`;
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
