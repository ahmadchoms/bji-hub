import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  requestPasswordResetAction,
  updatePasswordAction,
  registerAction,
} from "./auth.actions";

process.env.DATA_SOURCE = "mock";
process.env.ALLOW_MOCK_AUTH = "true";

describe("Password Reset Actions (B4)", () => {
  describe("requestPasswordResetAction", () => {
    it("rejects invalid email format", async () => {
      const res = await requestPasswordResetAction({
        email: "not-an-email",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("Format email tidak valid");
      }
    });

    it("returns uniform message on valid email to prevent account enumeration", async () => {
      const res = await requestPasswordResetAction({
        email: "user@example.com",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.message).toContain("Jika email Anda terdaftar");
      }
    });
  });

  describe("updatePasswordAction", () => {
    it("rejects password shorter than 8 characters", async () => {
      const res = await updatePasswordAction({
        password: "short",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("minimal 8 karakter");
      }
    });

    it("rejects common or easily guessed passwords", async () => {
      const res = await updatePasswordAction({
        password: "password123",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("terlalu umum");
      }
    });

    it("accepts strong password and returns redirect to login with reset flag", async () => {
      const res = await updatePasswordAction({
        password: "SuperSecretPassword2026!",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.redirectTo).toBe("/login?reset=success");
      }
    });
  });

  describe("registerAction password strength (N7)", () => {
    it("rejects registration with easily guessed password", async () => {
      const res = await registerAction({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        termsAccepted: true,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("terlalu umum");
      }
    });
  });
});
