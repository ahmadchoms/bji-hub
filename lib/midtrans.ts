import crypto from "crypto";

/**
 * Midtrans Webhook Signature verification.
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !payload.signature_key) return false;

  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const calculated = crypto.createHash("sha512").update(raw).digest("hex");

  return calculated === payload.signature_key;
}

/**
 * Request a Snap Transaction Token from Midtrans API.
 * Uses official HTTP API directly to keep zero extra dependencies.
 */
export async function createMidtransSnapToken(params: {
  orderId: string;
  grossAmount: number;
  customerName?: string;
  customerEmail?: string;
}): Promise<string | null> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return null;

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const endpoint = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: params.orderId,
          gross_amount: Math.round(params.grossAmount),
        },
        customer_details: {
          first_name: params.customerName || "Seller",
          email: params.customerEmail || "seller@bijihub.com",
        },
        ...(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
          ? {
              override_notification_url: `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/api/webhooks/midtrans`,
            }
          : {}),
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

/**
 * Maps Midtrans transaction_status and fraud_status to application payment status.
 */
export function mapMidtransStatus(
  transactionStatus?: string,
  fraudStatus?: string
): "paid" | "failed" | "pending" {
  if (
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept")
  ) {
    return "paid";
  }

  if (
    transactionStatus === "cancel" ||
    transactionStatus === "deny" ||
    transactionStatus === "expire"
  ) {
    return "failed";
  }

  return "pending";
}

/**
 * Fetch transaction status directly from Midtrans API.
 */
export async function checkMidtransStatus(orderId: string): Promise<{
  statusCode: string;
  transactionStatus: string;
  fraudStatus?: string;
  grossAmount?: string;
  paymentType?: string;
} | null> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return null;

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  try {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return {
      statusCode: data.status_code,
      transactionStatus: data.transaction_status,
      fraudStatus: data.fraud_status,
      grossAmount: data.gross_amount,
      paymentType: data.payment_type,
    };
  } catch {
    return null;
  }
}
