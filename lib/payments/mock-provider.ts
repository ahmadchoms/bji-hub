import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  ParsedWebhook,
} from "./types";

export const mockProvider: PaymentProvider = {
  id: "mock",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult | null> {
    return {
      providerRef: `mock-${input.orderRef}`,
      clientToken: `mock-${input.orderRef}`,
    };
  },

  async getStatus(): Promise<PaymentStatusResult | null> {
    return {
      status: "pending",
      amount: null,
    };
  },

  async parseWebhook(rawBody: string): Promise<ParsedWebhook | null> {
    try {
      const data = JSON.parse(rawBody);
      if (!data || typeof data !== "object") return null;
      const orderRef = data.orderRef || data.order_id;
      if (!orderRef) return null;

      const status =
        data.status === "paid" ||
        data.status === "failed" ||
        data.status === "expired" ||
        data.status === "canceled"
          ? data.status
          : "pending";

      const amount = typeof data.amount === "number" ? data.amount : null;

      return {
        orderRef: String(orderRef),
        status,
        amount,
      };
    } catch {
      // ignore: invalid JSON in mock webhook
      return null;
    }
  },
};
