import type { Payment } from "@/types";

const TYPE_LABELS: Record<Payment["type"], string> = {
  subscription: "Langganan",
  boost: "Boost",
  verification: "Verifikasi",
};

/** A boost with amount 0 was activated with a free monthly credit. */
export function isCreditBoost(
  payment: Pick<Payment, "type" | "amount" | "status">,
): boolean {
  return (
    payment.type === "boost" &&
    payment.amount === 0 &&
    payment.status === "paid"
  );
}

export function paymentTypeLabel(
  payment: Pick<Payment, "type" | "amount" | "status">,
): string {
  return isCreditBoost(payment)
    ? "Boost (kredit)"
    : (TYPE_LABELS[payment.type] ?? payment.type);
}
