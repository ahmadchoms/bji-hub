import { z } from "zod";

export const TRACK_EVENT_TYPES = [
  "impression",
  "view",
  "contact_click",
] as const;

export const trackPayloadSchema = z.object({
  listingId: z.string().min(1).max(100),
  type: z.enum(TRACK_EVENT_TYPES),
  sessionId: z.string().min(8).max(64),
});

export type TrackPayload = z.infer<typeof trackPayloadSchema>;
export type TrackEventType = TrackPayload["type"];
