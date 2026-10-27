import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentStatusResult,
  ParsedWebhook,
  PaymentStatus,
  RefundResult,
} from "./types";
import {
  createMidtransSnapToken,
  checkMidtransStatus,
  verifyMidtransSignature,
  requestMidtransRefund,
} from "@/lib/midtrans";

export function mapMidtransStatus(
  transactionStatus?: string,
  fraudStatus?: string,
): PaymentStatus {
  if (transactionStatus === "settlement") {
    return "paid";
  }
  if (transactionStatus === "capture") {
    if (fraudStatus === "challenge") return "pending";
    if (fraudStatus === "deny") return "failed";
    return "paid";
  }
  if (transactionStatus === "deny") {
    return "failed";
  }
  if (transactionStatus === "cancel") {
    return "canceled";
  }
  if (transactionStatus === "expire") {
    return "expired";
  }
  return "pending";
}

export const midtransProvider: PaymentProvider = {
  id: "midtrans",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult | null> {
    const token = await createMidtransSnapToken({
      orderId: input.orderRef,
      grossAmount: input.amount,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
    });

    if (!token) return null;

    return {
      providerRef: input.orderRef,
      clientToken: token,
    };
  },

  async getStatus(orderRef: string): Promise<PaymentStatusResult | null> {
    const data = await checkMidtransStatus(orderRef);
    if (!data) return null;

    const status = mapMidtransStatus(
      data.transactionStatus,
      data.fraudStatus,
    );
    const parsedAmount = data.grossAmount ? Number(data.grossAmount) : null;

    return {
      status,
      amount: parsedAmount !== null && Number.isFinite(parsedAmount) ? parsedAmount : null,
    };
  },

  async parseWebhook(rawBody: string): Promise<ParsedWebhook | null> {
    let body: {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_status?: string;
      fraud_status?: string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      // ignore: invalid JSON in webhook body
      return null;
    }

    if (!body || typeof body !== "object") return null;

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return null;
    }

    const isValid = verifyMidtransSignature({
      order_id,
      status_code,
      gross_amount: String(gross_amount),
      signature_key,
    });

    if (!isValid) return null;

    const status = mapMidtransStatus(transaction_status, fraud_status);
    const parsedAmount = Number(gross_amount);

    return {
      orderRef: order_id,
      status,
      amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
    };
  },

  async refund(orderRef: string, amount: number, reason: string): Promise<RefundResult> {
    const res = await requestMidtransRefund({
      orderId: orderRef,
      amount,
      reason,
    });

    if (!res) {
      return {
        success: false,
        status: "failed",
        message: "Gagal menghubungi gateway pembayaran Midtrans untuk proses pengembalian dana.",
      };
    }

    if (res.statusCode === "200" || res.statusCode === "201") {
      return {
        success: true,
        providerRef: res.refundChargeId || `ref-${orderRef}`,
        status: "processed",
        message: res.statusMessage,
      };
    }

    if (res.statusCode === "412" || res.statusCode === "400") {
      return {
        success: false,
        status: "manual_required",
        message: `${res.statusMessage || "Metode pembayaran tidak mendukung refund otomatis"}. Pengembalian dana perlu ditransfer manual ke rekening pembeli.`,
      };
    }

    return {
      success: false,
      status: "failed",
      message: res.statusMessage || "Pengembalian dana ditolak oleh payment gateway.",
    };
  },
};
