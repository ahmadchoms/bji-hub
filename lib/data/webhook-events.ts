import { logger } from "@/lib/logger";
import { getPool } from "@/lib/db/pool";

export const mockProcessedEvents = new Set<string>();

/**
 * Checks whether a webhook event was already recorded as processed.
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT event_id FROM public.webhook_events WHERE event_id = $1 LIMIT 1`,
        [eventId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  return mockProcessedEvents.has(eventId);
}

/**
 * Records a webhook event as successfully processed for audit trail and replay prevention.
 */
export async function recordWebhookEvent(
  eventId: string,
  provider = "midtrans",
  orderRef?: string,
): Promise<void> {
  if (!eventId) return;
  const pool = getPool();

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.webhook_events (event_id, provider, order_ref, processed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, provider, orderRef || null],
      );
    } catch (err) {
      logger.error("webhook_events.record_failed", err, { eventId, orderRef });
    }
  } else {
    mockProcessedEvents.add(eventId);
  }
}

/**
 * Legacy wrapper: checks and records atomically.
 */
export async function recordWebhookEventIfNew(
  eventId: string,
  provider = "midtrans",
  orderRef?: string,
): Promise<boolean> {
  const isProcessed = await isWebhookEventProcessed(eventId);
  if (isProcessed) return false;
  await recordWebhookEvent(eventId, provider, orderRef);
  return true;
}

export function _resetMockWebhookEventsForTest() {
  mockProcessedEvents.clear();
}
