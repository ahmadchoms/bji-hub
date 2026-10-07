import { mockListings } from "@/lib/mock/data";
import { isActiveBoost } from "@/lib/boost";
import { DEDUPE_MS, DEFAULT_RATE_LIMIT } from "@/lib/analytics-rules";
import { DAY_MS, addToBucket, dayKey, emptyDayBuckets, type DailyEventPoint } from "@/lib/analytics-series";
import type { AnalyticsEvent } from "@/types";
import type { TrackPayload } from "@/lib/validations/track.schema";

interface AnalyticsStore {
  events: AnalyticsEvent[];
  lastSeen: Map<string, number>;
  recent: Map<string, number[]>;
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Demo history for days 1-29 ago so dashboards are not empty. Disable with ANALYTICS_DEMO_SEED=off. */
export function generateDemoEvents(now: number = Date.now()): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  let n = 0;
  const push = (listingId: string, eventType: AnalyticsEvent["eventType"], at: number) => {
    events.push({ id: `seed-${n++}`, listingId, eventType, createdAt: new Date(at).toISOString() });
  };

  for (const l of mockListings) {
    if (l.status !== "active") continue;
    const base = 6 + (hash(l.id) % 14);
    const boostEnd = l.isBoosted && l.boostUntil ? new Date(l.boostUntil).getTime() : null;
    // Active boosts started 2-6 days ago; expired ones ran for the 7 days before they ended.
    const boostStart =
      boostEnd === null ? null : boostEnd > now ? now - (2 + (hash(l.id) % 5)) * DAY_MS : boostEnd - 7 * DAY_MS;

    for (let d = 1; d <= 29; d++) {
      const at = now - d * DAY_MS;
      const inBoost = boostStart !== null && boostEnd !== null && at >= boostStart && at <= boostEnd;
      const wave = 0.75 + 0.5 * ((hash(`${l.id}:${d}`) % 100) / 100);
      const views = Math.round(base * wave * (inBoost ? 1.6 : 1));
      const clicks = Math.round(views * (0.08 + (hash(`${l.id}:c:${d}`) % 8) / 100));
      const impressions = inBoost ? 40 + (hash(`${l.id}:i:${d}`) % 50) : 0;

      for (let i = 0; i < views; i++) push(l.id, "view", at - i * 600_000);
      for (let i = 0; i < clicks; i++) push(l.id, "contact_click", at - i * 900_000);
      for (let i = 0; i < impressions; i++) push(l.id, "impression", at - i * 300_000);
    }
  }
  return events;
}

function createStore(): AnalyticsStore {
  const seeded = process.env.ANALYTICS_DEMO_SEED !== "off";
  return { events: seeded ? generateDemoEvents() : [], lastSeen: new Map(), recent: new Map() };
}

const globalRef = globalThis as unknown as { __bijiAnalytics?: AnalyticsStore };
const store: AnalyticsStore = (globalRef.__bijiAnalytics ??= createStore());

export type RecordResult = "recorded" | "duplicate" | "ignored" | "rate_limited";

export function recordEvent(
  payload: TrackPayload,
  now: number = Date.now(),
  rateLimit: { max: number; windowMs: number } = DEFAULT_RATE_LIMIT
): RecordResult {
  const listing = mockListings.find((l) => l.id === payload.listingId);
  if (!listing || listing.status !== "active") return "ignored";
  if (payload.type === "impression" && !isActiveBoost(listing, now)) return "ignored";

  const stamps = (store.recent.get(payload.sessionId) ?? []).filter(
    (t) => now - t < rateLimit.windowMs
  );
  if (stamps.length >= rateLimit.max) {
    store.recent.set(payload.sessionId, stamps);
    return "rate_limited";
  }

  const key = `${payload.sessionId}:${payload.listingId}:${payload.type}`;
  const last = store.lastSeen.get(key);
  if (last !== undefined && now - last < DEDUPE_MS[payload.type]) return "duplicate";

  stamps.push(now);
  store.recent.set(payload.sessionId, stamps);
  store.lastSeen.set(key, now);
  store.events.push({
    id: crypto.randomUUID(),
    listingId: payload.listingId,
    eventType: payload.type,
    createdAt: new Date(now).toISOString(),
  });
  return "recorded";
}

export interface ListingEventCounts {
  impressions: number;
  views: number;
  contactClicks: number;
}

export function getListingEventCounts(listingId: string, sinceMs = 0): ListingEventCounts {
  const counts: ListingEventCounts = { impressions: 0, views: 0, contactClicks: 0 };
  for (const e of store.events) {
    if (e.listingId !== listingId || new Date(e.createdAt).getTime() < sinceMs) continue;
    if (e.eventType === "impression") counts.impressions++;
    else if (e.eventType === "view") counts.views++;
    else counts.contactClicks++;
  }
  return counts;
}

export type { DailyEventPoint };

/** Daily buckets (Asia/Jakarta) for the last `days` days, oldest first, including today. */
export function getEventSeries(
  listingIds: readonly string[],
  days: number,
  now: number = Date.now()
): DailyEventPoint[] {
  const ids = new Set(listingIds);
  const buckets = emptyDayBuckets(days, now);
  for (const e of store.events) {
    if (ids.has(e.listingId)) addToBucket(buckets, dayKey(new Date(e.createdAt)), e.eventType);
  }
  return [...buckets.values()];
}

export function resetAnalyticsStore(): void {
  store.events.length = 0;
  store.lastSeen.clear();
  store.recent.clear();
}
