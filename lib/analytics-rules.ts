import type { TrackEventType } from "@/lib/validations/track.schema";

/** Repeat events from the same session, listing and type inside this window are ignored. */
export const DEDUPE_MS: Record<TrackEventType, number> = {
  impression: 30 * 60_000,
  view: 30 * 60_000,
  contact_click: 60_000,
};

/** One session may record at most `max` events per `windowMs`. */
export const DEFAULT_RATE_LIMIT = { max: 60, windowMs: 60_000 };
