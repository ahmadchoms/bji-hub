export const DAY_MS = 86_400_000;
export const TIME_ZONE = "Asia/Jakarta";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayLabelFmt = new Intl.DateTimeFormat("id-ID", { timeZone: TIME_ZONE, day: "numeric", month: "short" });

export interface DailyEventPoint {
  date: string;
  views: number;
  clicks: number;
  impressions: number;
}

/** "2026-10-05" in Asia/Jakarta. */
export const dayKey = (ms: number | Date): string => dayKeyFmt.format(ms);

/** One empty bucket per day for the last `days` days (oldest first, including today), keyed by `dayKey`. */
export function emptyDayBuckets(days: number, now: number = Date.now()): Map<string, DailyEventPoint> {
  const buckets = new Map<string, DailyEventPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const t = now - i * DAY_MS;
    buckets.set(dayKey(t), { date: dayLabelFmt.format(t), views: 0, clicks: 0, impressions: 0 });
  }
  return buckets;
}

export function addToBucket(
  buckets: Map<string, DailyEventPoint>,
  key: string,
  eventType: "impression" | "view" | "contact_click",
  count = 1
): void {
  const bucket = buckets.get(key);
  if (!bucket) return;
  if (eventType === "view") bucket.views += count;
  else if (eventType === "contact_click") bucket.clicks += count;
  else bucket.impressions += count;
}
