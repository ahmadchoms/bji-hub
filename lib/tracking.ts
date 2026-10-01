import type {
  TrackEventType,
  TrackPayload,
} from "@/lib/validations/track.schema";

const SESSION_KEY = "biji_sid";

const CLIENT_DEDUPE_MS: Record<TrackEventType, number> = {
  impression: 30 * 60_000,
  view: 30 * 60_000,
  contact_click: 5_000,
};

function getSessionId(): string | null {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function trackEvent(listingId: string, type: TrackEventType): void {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  const dedupeKey = `biji_t:${type}:${listingId}`;
  try {
    const last = Number(sessionStorage.getItem(dedupeKey) ?? 0);
    if (Date.now() - last < CLIENT_DEDUPE_MS[type]) return;
    sessionStorage.setItem(dedupeKey, String(Date.now()));
  } catch {
    return;
  }

  const payload: TrackPayload = { listingId, type, sessionId };
  const body = JSON.stringify(payload);
  const sent = navigator.sendBeacon?.(
    "/api/track",
    new Blob([body], { type: "application/json" }),
  );

  if (!sent) {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}
