import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  recordUserConsent,
  hasUserAcceptedLatest,
  getUserConsents,
  mockUserConsents,
} from "@/lib/data/consents";
import { CURRENT_VERSIONS } from "./versions";

describe("lib/legal/consents (F1)", () => {
  beforeEach(() => {
    mockUserConsents.length = 0;
  });

  it("records user consent and confirms latest acceptance", async () => {
    const isAcceptedBefore = await hasUserAcceptedLatest("user-1", "terms");
    expect(isAcceptedBefore).toBe(false);

    const record = await recordUserConsent({
      userId: "user-1",
      document: "terms",
      ipHash: "hash-ip-123",
    });

    expect(record.userId).toBe("user-1");
    expect(record.document).toBe("terms");
    expect(record.version).toBe(CURRENT_VERSIONS.terms);
    expect(record.ipHash).toBe("hash-ip-123");

    const isAcceptedAfter = await hasUserAcceptedLatest("user-1", "terms");
    expect(isAcceptedAfter).toBe(true);

    // Other documents remain unaccepted
    const privacyAccepted = await hasUserAcceptedLatest("user-1", "privacy");
    expect(privacyAccepted).toBe(false);
  });

  it("updates existing consent on duplicate acceptance", async () => {
    await recordUserConsent({
      userId: "user-1",
      document: "privacy",
      ipHash: "hash-1",
    });
    expect(mockUserConsents.length).toBe(1);

    await recordUserConsent({
      userId: "user-1",
      document: "privacy",
      ipHash: "hash-2",
    });
    expect(mockUserConsents.length).toBe(1);
    expect(mockUserConsents[0].ipHash).toBe("hash-2");
  });

  it("detects when accepted version is outdated", async () => {
    // Record old version
    await recordUserConsent({
      userId: "user-1",
      document: "terms",
      version: "2025-01-v0",
    });

    const isLatest = await hasUserAcceptedLatest("user-1", "terms");
    expect(isLatest).toBe(false);
  });
});
