import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getUserNotificationPrefs,
  updateUserNotificationPrefs,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  mockNotificationPrefs,
} from "./reminders";

describe("Notification Preferences & Smart Reminders (Task J5)", () => {
  beforeEach(() => {
    vi.stubEnv("DATA_SOURCE", "mock");
    mockNotificationPrefs.clear();
  });

  describe("Preferences Management", () => {
    it("returns default preferences (reminders=true, emailReminders=false) when unset", async () => {
      const prefs = await getUserNotificationPrefs("user-new-1");
      expect(prefs.reminders).toBe(true);
      expect(prefs.emailReminders).toBe(false);
    });

    it("updates and retrieves notification preferences", async () => {
      const updated = await updateUserNotificationPrefs("user-pref-1", {
        reminders: false,
        emailReminders: true,
      });
      expect(updated).toBe(true);

      const prefs = await getUserNotificationPrefs("user-pref-1");
      expect(prefs.reminders).toBe(false);
      expect(prefs.emailReminders).toBe(true);
    });

    it("partially updates notification preferences without wiping unset fields", async () => {
      await updateUserNotificationPrefs("user-pref-2", {
        reminders: false,
        emailReminders: true,
      });

      // Update only reminders back to true
      await updateUserNotificationPrefs("user-pref-2", { reminders: true });

      const prefs = await getUserNotificationPrefs("user-pref-2");
      expect(prefs.reminders).toBe(true);
      expect(prefs.emailReminders).toBe(true);
    });
  });

  describe("HMAC Signed Unsubscribe Tokens", () => {
    it("creates and verifies a valid token for a user", () => {
      const userId = "usr-unsub-99";
      const token = createUnsubscribeToken(userId);
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // SHA-256 hex string

      const isValid = verifyUnsubscribeToken(userId, token);
      expect(isValid).toBe(true);
    });

    it("rejects invalid or tampered tokens", () => {
      const userId = "usr-unsub-99";
      const token = createUnsubscribeToken(userId);

      // Tampered token
      const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
      expect(verifyUnsubscribeToken(userId, tampered)).toBe(false);

      // Different user ID
      expect(verifyUnsubscribeToken("another-user", token)).toBe(false);

      // Invalid length token
      expect(verifyUnsubscribeToken(userId, "short-token")).toBe(false);
    });
  });
});
