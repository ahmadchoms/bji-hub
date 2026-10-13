import { describe, expect, it } from "vitest";
import {
  loginSchema,
  registerSchema,
  sellerOnboardingSchema,
} from "./auth.schema";

describe("auth.schema", () => {
  describe("loginSchema", () => {
    it("validates correct email and password", () => {
      const res = loginSchema.safeParse({
        email: "buyer@example.com",
        password: "secretpassword",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid email and short password", () => {
      const res = loginSchema.safeParse({
        email: "not-an-email",
        password: "123",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates buyer registration when terms are accepted", () => {
      const res = registerSchema.safeParse({
        name: "Budi Santoso",
        email: "budi@example.com",
        password: "password123",
        termsAccepted: true,
      });
      expect(res.success).toBe(true);
    });

    it("rejects registration when terms are rejected", () => {
      const res = registerSchema.safeParse({
        name: "Budi",
        email: "budi@example.com",
        password: "password123",
        termsAccepted: false,
      });
      expect(res.success).toBe(false);
    });
  });

  describe("sellerOnboardingSchema", () => {
    it("sanitizes spaces and hyphens in whatsappNumber and formats to 62", () => {
      const res = sellerOnboardingSchema.safeParse({
        businessName: "Kebun Kopi Puntang",
        whatsappNumber: "0812-3456-7890",
        province: "Jawa Barat",
        city: "Kabupaten Bandung",
        address: "Jl. Puntang No. 10",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.whatsappNumber).toBe("6281234567890");
      }
    });

    it("rejects business name that is too short", () => {
      const res = sellerOnboardingSchema.safeParse({
        businessName: "K",
        whatsappNumber: "081234567890",
        province: "Aceh",
        city: "Banda Aceh",
        address: "Jl. Merdeka",
      });
      expect(res.success).toBe(false);
    });
  });
});
