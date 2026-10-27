export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "canceled";

export interface PaymentLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreatePaymentInput {
  orderRef: string;
  amount: number;
  customer: { name: string; email: string; phone?: string };
  items: PaymentLineItem[];
}

export interface CreatePaymentResult {
  providerRef: string;
  clientToken: string | null;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  amount: number | null;
}

export interface ParsedWebhook {
  orderRef: string;
  status: PaymentStatus;
  amount: number | null;
}

export type RefundStatus = "processed" | "pending" | "failed" | "manual_required";

export interface RefundResult {
  success: boolean;
  providerRef?: string;
  status: RefundStatus;
  message?: string;
}

export interface PaymentProvider {
  readonly id: "midtrans" | "mock";
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult | null>;
  getStatus(orderRef: string): Promise<PaymentStatusResult | null>;
  parseWebhook(rawBody: string): Promise<ParsedWebhook | null>;
  refund(orderRef: string, amount: number, reason: string): Promise<RefundResult>;
}
