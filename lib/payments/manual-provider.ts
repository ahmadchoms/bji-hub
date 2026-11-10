import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  ParsedWebhook,
  RefundResult,
} from "./types";

/**
 * Provider pembayaran statis (QRIS Statis & Transfer Bank Manual).
 * Verifikasi dilakukan melalui konfirmasi WhatsApp ke admin dan disetujui di Admin Dashboard.
 */
export const manualProvider: PaymentProvider = {
  id: "manual",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult | null> {
    return {
      providerRef: `MANUAL-${input.orderRef}`,
      clientToken: null,
    };
  },

  async getStatus(): Promise<PaymentStatusResult | null> {
    return {
      status: "pending",
      amount: null,
    };
  },

  async parseWebhook(): Promise<ParsedWebhook | null> {
    // Pembayaran manual diverifikasi oleh admin, tidak melalui webhook otomatis.
    return null;
  },

  async refund(orderRef: string, amount: number, reason: string): Promise<RefundResult> {
    return {
      success: true,
      providerRef: `ref-manual-${Date.now()}`,
      status: "manual_required",
      message: `Pengembalian dana sebesar Rp ${Math.round(amount).toLocaleString("id-ID")} untuk pesanan ${orderRef} memerlukan transfer manual oleh admin (${reason}).`,
    };
  },
};
