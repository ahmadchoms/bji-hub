import { describe, it, expectTypeOf } from "vitest";
import {
  UserId,
  SellerProfileId,
  ListingId,
  OrderId,
  asUserId,
  asSellerProfileId,
  asListingId,
  asOrderId,
} from "./ids";

describe("Branded ID Types (B1)", () => {
  it("brands strings to their respective ID types", () => {
    const raw = "test-uuid-123";
    const userId = asUserId(raw);
    const sellerId = asSellerProfileId(raw);
    const listingId = asListingId(raw);
    const orderId = asOrderId(raw);

    expectTypeOf(userId).toEqualTypeOf<UserId>();
    expectTypeOf(sellerId).toEqualTypeOf<SellerProfileId>();
    expectTypeOf(listingId).toEqualTypeOf<ListingId>();
    expectTypeOf(orderId).toEqualTypeOf<OrderId>();

    // Assert UserId is not assignable to SellerProfileId
    expectTypeOf(userId).not.toEqualTypeOf<SellerProfileId>();
    expectTypeOf(listingId).not.toEqualTypeOf<OrderId>();
  });

  it("prevents passing UserId to a function expecting SellerProfileId at compile time", () => {
    function acceptSeller(id: SellerProfileId): string {
      return id;
    }

    const sellerId = asSellerProfileId("seller-123");
    expectTypeOf(acceptSeller(sellerId)).toEqualTypeOf<string>();

    // Type signature test: function parameter must match SellerProfileId
    expectTypeOf(acceptSeller).parameter(0).toEqualTypeOf<SellerProfileId>();
    expectTypeOf(acceptSeller).parameter(0).not.toEqualTypeOf<UserId>();
  });
});
