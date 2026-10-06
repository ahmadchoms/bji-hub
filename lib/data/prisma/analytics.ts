import { DEDUPE_MS, DEFAULT_RATE_LIMIT } from "@/lib/analytics-rules";
import {
  DAY_MS,
  addToBucket,
  emptyDayBuckets,
  type DailyEventPoint,
} from "@/lib/analytics-series";
import { isActiveBoost } from "@/lib/boost";
import type { DataRepository } from "@/lib/data/contract";
import { getPrisma } from "@/lib/data/prisma/client";
import { TIME_ZONE } from "@/lib/analytics-series";
import { ListingWithRelations } from "@/types";

const STATS_WINDOW_DAYS = 30;

interface EventRow {
  listingId: string;
  day: string;
  eventType: "impression" | "view" | "contact_click";
  count: number;
}

/** Event counts per listing, Jakarta day, and type for the last `days` days. */
async function eventRows(
  listingIds: string[],
  days: number,
  now: number,
): Promise<EventRow[]> {
  if (listingIds.length === 0) return [];
  const since = new Date(now - (days + 1) * DAY_MS);
  return getPrisma().$queryRaw<EventRow[]>`
    SELECT "listingId",
           to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day,
           "eventType"::text AS "eventType",
           COUNT(*)::int AS count
    FROM analytics_events
    WHERE "listingId" = ANY(${listingIds}) AND "createdAt" >= ${since}
    GROUP BY 1, 2, 3`;
}

function seriesFor(
  rows: EventRow[],
  days: number,
  now: number,
): DailyEventPoint[] {
  const buckets = emptyDayBuckets(days, now);
  for (const row of rows)
    addToBucket(buckets, row.day, row.eventType, row.count);
  return [...buckets.values()];
}

const sum = (
  series: DailyEventPoint[],
  key: "views" | "clicks" | "impressions",
) => series.reduce((total, point) => total + point[key], 0);
const rate = (clicks: number, views: number) =>
  views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : 0;

type AnalyticsMethods = Pick<
  DataRepository,
  "getSellerStats" | "getSellerListingPerformance" | "recordTrackEvent"
>;

export const analytics: AnalyticsMethods = {
  async getSellerStats(sellerId) {
    const prisma = getPrisma();
    const now = Date.now();
    const [listings, inquiryCount] = await Promise.all([
      prisma.listing.findMany({
        where: { sellerId },
        select: { id: true, status: true },
      }),
      prisma.inquiry.count({ where: { listing: { is: { sellerId } } } }),
    ]);

    const series = seriesFor(
      await eventRows(
        listings.map((l) => l.id),
        STATS_WINDOW_DAYS,
        now,
      ),
      STATS_WINDOW_DAYS,
      now,
    );
    const totalViews = sum(series, "views");
    const totalClicks = sum(series, "clicks");
    const totalImpressions = sum(series, "impressions");
    const hasEvents = totalViews + totalClicks + totalImpressions > 0;

    return {
      totalViews,
      totalClicks,
      totalImpressions,
      conversionRate: rate(totalClicks, totalViews),
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === "active").length,
      inquiryCount,
      metrics: hasEvents
        ? series.map(({ date, views, clicks }) => ({ date, views, clicks }))
        : [],
    };
  },

  async getSellerListingPerformance(sellerId) {
    const now = Date.now();
    const listings = await getPrisma().listing.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        slug: true,
        isBoosted: true,
        boostUntil: true,
      },
    });
    const rows = await eventRows(
      listings.map((l) => l.id),
      STATS_WINDOW_DAYS,
      now,
    );

    return listings
      .map((listing) => {
        const series = seriesFor(
          rows.filter((r) => r.listingId === listing.id),
          STATS_WINDOW_DAYS,
          now,
        );
        const views = sum(series, "views");
        const clicks = sum(series, "clicks");
        const boostUntil = listing.boostUntil
          ? listing.boostUntil.toISOString()
          : null;
        return {
          listingId: listing.id,
          title: listing.title,
          slug: listing.slug,
          views,
          clicks,
          impressions: sum(series, "impressions"),
          conversionRate: rate(clicks, views),
          boostUntil: isActiveBoost(
            {
              ...listing,
              isBoosted: listing.isBoosted,
              boostUntil,
            } as ListingWithRelations,
            now,
          )
            ? boostUntil
            : null,
        };
      })
      .sort((a, b) => b.clicks - a.clicks || b.views - a.views);
  },

  async recordTrackEvent(payload) {
    const prisma = getPrisma();
    const now = Date.now();

    const listing = await prisma.listing.findUnique({
      where: { id: payload.listingId },
      select: { status: true, isBoosted: true, boostUntil: true },
    });
    if (!listing || listing.status !== "active") return "ignored";
    const boost = {
      isBoosted: listing.isBoosted,
      boostUntil: listing.boostUntil?.toISOString() ?? null,
    };
    if (
      payload.type === "impression" &&
      !isActiveBoost(boost as ListingWithRelations, now)
    )
      return "ignored";

    const recent = await prisma.analyticsEvent.count({
      where: {
        sessionId: payload.sessionId,
        createdAt: { gt: new Date(now - DEFAULT_RATE_LIMIT.windowMs) },
      },
    });
    if (recent >= DEFAULT_RATE_LIMIT.max) return "rate_limited";

    const duplicate = await prisma.analyticsEvent.findFirst({
      where: {
        sessionId: payload.sessionId,
        listingId: payload.listingId,
        eventType: payload.type,
        createdAt: { gt: new Date(now - DEDUPE_MS[payload.type]) },
      },
      select: { id: true },
    });
    if (duplicate) return "duplicate";

    await prisma.analyticsEvent.create({
      data: {
        listingId: payload.listingId,
        eventType: payload.type,
        sessionId: payload.sessionId,
        createdAt: new Date(now),
      },
    });
    return "recorded";
  },
};
