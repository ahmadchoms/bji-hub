import { Pool } from "pg";
import { logger } from "@/lib/logger";

let poolInstance: Pool | null = null;
function getPool(): Pool | null {
  if (process.env.DATA_SOURCE === "mock") return null;
  const conn = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!conn) return null;
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: conn });
  }
  return poolInstance;
}

export const mockProcessedEvents = new Set<string>();

/**
 * Checks and records a webhook event atomically to prevent replay attacks
 * and out-of-order duplicates.
 * Returns true if this is a NEW event (should process).
 * Returns false if this event was ALREADY PROCESSED (replay/duplicate, skip).
 */
export async function recordWebhookEventIfNew(
  eventId: string,
  provider = "midtrans",
  orderRef?: string,
): Promise<boolean> {
  if (!eventId) return true;
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO public.webhook_events (event_id, provider, order_ref, processed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [eventId, provider, orderRef || null],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("webhook_events.record_failed", err, { eventId, orderRef });
      // If table doesn't exist yet, do not block payment flow, fall through to allow processing
      return true;
    }
  }

  if (mockProcessedEvents.has(eventId)) {
    return false;
  }
  mockProcessedEvents.add(eventId);
  return true;
}

export function _resetMockWebhookEventsForTest() {
  mockProcessedEvents.clear();
}
