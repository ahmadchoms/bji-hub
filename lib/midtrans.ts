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
          email: params.customerEmail || "seller@bijicorp.com",
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}
