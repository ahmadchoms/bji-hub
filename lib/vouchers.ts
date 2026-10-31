export type VoucherType = "percent" | "fixed" | "free_shipping";
export type DiscountFundedBy = "platform" | "seller";

export interface VoucherRule {
  type: VoucherType;
  value: number;
  minSubtotal: number;
  maxDiscount?: number | null;
}

export interface VoucherData {
  id: string;
  code: string;
  sellerId?: string | null;
  type: VoucherType;
  value: number;
  minSubtotal: number;
  maxDiscount?: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit?: number | null;
  perUserLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export function calculateVoucherDiscount(
  rule: VoucherRule,
  subtotal: number,
  shippingCost: number,
): number {
  if (subtotal < rule.minSubtotal) return 0;
  let discount = 0;
  if (rule.type === "percent") {
    discount = Math.floor((subtotal * rule.value) / 100);
  } else if (rule.type === "fixed") {
    discount = rule.value;
  } else {
    discount = shippingCost;
  }

  if (rule.maxDiscount !== null && rule.maxDiscount !== undefined) {
    discount = Math.min(discount, rule.maxDiscount);
  }

  const cap = rule.type === "free_shipping" ? shippingCost : subtotal;
  return Math.max(0, Math.min(discount, cap));
}
