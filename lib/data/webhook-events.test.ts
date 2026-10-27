import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  recordWebhookEventIfNew,
  _resetMockWebhookEventsForTest,
} from "./webhook-events";

describe("recordWebhookEventIfNew (S5 Replay Protection)", () => {
  beforeEach(() => {
    _resetMockWebhookEventsForTest();
  });

  it("returns true for a new webhook event", async () => {
    const isNew = await recordWebhookEventIfNew("evt-12345", "midtrans", "ord-1");
    expect(isNew).toBe(true);
  });

  it("returns false for a replayed webhook event with same eventId", async () => {
    const first = await recordWebhookEventIfNew("evt-duplicate", "midtrans", "ord-1");
    expect(first).toBe(true);

    const replay = await recordWebhookEventIfNew("evt-duplicate", "midtrans", "ord-1");
    expect(replay).toBe(false);
  });

  it("allows different events for the same order", async () => {
    const evt1 = await recordWebhookEventIfNew("evt-pending", "midtrans", "ord-1");
    const evt2 = await recordWebhookEventIfNew("evt-settlement", "midtrans", "ord-1");

    expect(evt1).toBe(true);
    expect(evt2).toBe(true);
  });
});
