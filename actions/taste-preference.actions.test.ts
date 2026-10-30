process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveTastePreferencesAction,
  getTastePreferencesAction,
} from "./taste-preference.actions";

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";

describe("Taste Preference Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles guest user gracefully without error", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "guest",
      sellerId: null,
      userId: null,
    });

    const res = await saveTastePreferencesAction({
      acidityPref: 3.5,
      roastPref: ["Light", "Medium"],
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.saved).toBe(false);
    }
  });

  it("persists taste preferences for authenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue({
      role: "buyer",
      sellerId: null,
      userId: "test-user-pref-1",
      email: "test@example.com",
    });

    const saveRes = await saveTastePreferencesAction({
      acidityPref: 4.0,
      bodyPref: 3.0,
      roastPref: ["Medium-Light"],
      flavorTags: ["buah", "jeruk", "melati"],
    });

    expect(saveRes.success).toBe(true);

    const getRes = await getTastePreferencesAction();
    expect(getRes.success).toBe(true);
    if (getRes.success && getRes.data) {
      expect(getRes.data.acidityPref).toBe(4.0);
      expect(getRes.data.flavorTags).toContain("buah");
    }
  });
});
