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
