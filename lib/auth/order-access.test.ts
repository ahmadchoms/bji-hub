import { describe, expect, it } from "vitest";
import { canAccessOrder, type AccessibleOrder } from "./order-access";
import type { Session } from "@/lib/auth/roles";

describe("canAccessOrder access control", () => {
  const order: AccessibleOrder = {
    buyerId: "u-buyer-1",
    sellerId: "s-seller-1",
    accessToken: "sec_tok_1234567890abcdef",
  };

  const guestSession: Session = {
    role: "guest",
    sellerId: null,
    userId: null,
    email: null,
  };

  const adminSession: Session = {
    role: "admin",
    sellerId: null,
    userId: "u-admin",
    email: "admin@bijihub.com",
  };

  const ownerBuyerSession: Session = {
    role: "buyer",
    sellerId: null,
    userId: "u-buyer-1",
    email: "buyer@example.com",
  };

  const otherBuyerSession: Session = {
    role: "buyer",
    sellerId: null,
    userId: "u-buyer-99",
    email: "other@example.com",
  };

  const ownerSellerSession: Session = {
    role: "seller",
    sellerId: "s-seller-1",
    userId: "u-seller-user-1",
    email: "seller1@example.com",
  };

  const otherSellerSession: Session = {
    role: "seller",
    sellerId: "s-seller-99",
    userId: "u-seller-user-99",
    email: "seller99@example.com",
  };

  it("rejects guest without token", () => {
    expect(canAccessOrder(order, guestSession)).toBe(false);
  });

  it("rejects guest with wrong token", () => {
    expect(canAccessOrder(order, guestSession, "wrong_token")).toBe(false);
  });

  it("accepts guest with correct token", () => {
    expect(canAccessOrder(order, guestSession, "sec_tok_1234567890abcdef")).toBe(true);
  });

  it("rejects other buyer without token", () => {
    expect(canAccessOrder(order, otherBuyerSession)).toBe(false);
  });

  it("rejects other seller without token", () => {
    expect(canAccessOrder(order, otherSellerSession)).toBe(false);
  });

  it("accepts owner buyer", () => {
    expect(canAccessOrder(order, ownerBuyerSession)).toBe(true);
  });

  it("accepts owner seller", () => {
    expect(canAccessOrder(order, ownerSellerSession)).toBe(true);
  });

  it("accepts admin unconditionally", () => {
    expect(canAccessOrder(order, adminSession)).toBe(true);
  });
});
