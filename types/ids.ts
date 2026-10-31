export type UserId = string & { readonly __brand: "UserId" };
export type SellerProfileId = string & { readonly __brand: "SellerProfileId" };
export type ListingId = string & { readonly __brand: "ListingId" };
export type OrderId = string & { readonly __brand: "OrderId" };

export const asUserId = (value: string): UserId => value as UserId;
export const asSellerProfileId = (value: string): SellerProfileId =>
  value as SellerProfileId;
export const asListingId = (value: string): ListingId => value as ListingId;
export const asOrderId = (value: string): OrderId => value as OrderId;
