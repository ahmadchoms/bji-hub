import { describe, it, expect } from "vitest";
import { canAccessOrder, type AccessibleOrder } from "@/lib/auth/order-access";
import type { Session } from "@/lib/auth/roles";

describe("Order Authorization Matrix (AuthZ)", () => {
  const sampleOrder: AccessibleOrder = {
    buyerId: "user-buyer-a",
    sellerId: "seller-toko-a",
    accessToken: "valid-secret-token-12345",
  };

  const buyerASession: Session = {
    role: "buyer",
    userId: "user-buyer-a",
    sellerId: null,
    email: "buyer.a@example.com",
  };

  const buyerBSession: Session = {
    role: "buyer",
    userId: "user-buyer-b",
    sellerId: null,
    email: "buyer.b@example.com",
  };

  const sellerASession: Session = {
    role: "seller",
    userId: "user-seller-a",
    sellerId: "seller-toko-a",
    email: "seller.a@example.com",
  };

  const sellerBSession: Session = {
    role: "seller",
    userId: "user-seller-b",
    sellerId: "seller-toko-b",
    email: "seller.b@example.com",
  };

  const adminSession: Session = {
    role: "admin",
    userId: "user-admin",
    sellerId: null,
    email: "admin@bijihub.com",
  };

  const guestSession: Session = {
    role: "guest",
    userId: null,
    sellerId: null,
    email: null,
  };

  it("ALLOW: Buyer A can access their own order", () => {
    expect(canAccessOrder(sampleOrder, buyerASession)).toBe(true);
  });

  it("DENY: Buyer B CANNOT access Buyer A order", () => {
    expect(canAccessOrder(sampleOrder, buyerBSession)).toBe(false);
  });

  it("DENY: Guest without token CANNOT access order", () => {
    expect(canAccessOrder(sampleOrder, guestSession)).toBe(false);
    expect(canAccessOrder(sampleOrder, guestSession, "")).toBe(false);
  });

  it("ALLOW: Guest with valid secret token can access order", () => {
    expect(canAccessOrder(sampleOrder, guestSession, "valid-secret-token-12345")).toBe(true);
  });

  it("DENY: Guest with invalid or manipulated secret token CANNOT access order", () => {
    expect(canAccessOrder(sampleOrder, guestSession, "wrong-token-abc")).toBe(false);
  });

  it("ALLOW: Seller Toko A can access order purchased from Toko A", () => {
    expect(canAccessOrder(sampleOrder, sellerASession)).toBe(true);
  });

  it("DENY: Seller Toko B CANNOT access order purchased from Toko A", () => {
    expect(canAccessOrder(sampleOrder, sellerBSession)).toBe(false);
  });

  it("ALLOW: Admin can access any order", () => {
    expect(canAccessOrder(sampleOrder, adminSession)).toBe(true);
  });

  describe("Shipment Tracking permissions", () => {
    function canUpdateTracking(order: AccessibleOrder, session: Session): boolean {
      const isSeller = Boolean(session.sellerId && order.sellerId === session.sellerId);
      const isAdmin = session.role === "admin";
      return isSeller || isAdmin;
    }

    it("ALLOW: Seller of Toko A can update tracking for Toko A order", () => {
      expect(canUpdateTracking(sampleOrder, sellerASession)).toBe(true);
    });

    it("DENY: Seller of Toko B CANNOT update tracking for Toko A order", () => {
      expect(canUpdateTracking(sampleOrder, sellerBSession)).toBe(false);
    });

    it("DENY: Buyer CANNOT update tracking number", () => {
      expect(canUpdateTracking(sampleOrder, buyerASession)).toBe(false);
    });

    it("ALLOW: Admin can update tracking for any order", () => {
      expect(canUpdateTracking(sampleOrder, adminSession)).toBe(true);
    });
  });
});
