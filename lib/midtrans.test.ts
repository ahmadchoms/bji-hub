import { describe, expect, it } from "vitest";
import { verifyMidtransSignature } from "./midtrans";
import crypto from "crypto";

describe("Midtrans Signature Verification", () => {
  it("verifies valid SHA-512 signature using configured server key", () => {
    const order_id = "ORDER-TEST-001";
    const status_code = "200";
    const gross_amount = "150000.00";
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "mock-test-server-key";

    const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const signature_key = crypto.createHash("sha512").update(raw).digest("hex");

    const valid = verifyMidtransSignature({
      order_id,
      status_code,
      gross_amount,
      signature_key,
    });

    expect(valid).toBe(true);
  });

  it("rejects invalid signature key", () => {
    const valid = verifyMidtransSignature({
      order_id: "ORDER-TEST-002",
      status_code: "200",
      gross_amount: "50000.00",
      signature_key: "tampered-signature-key",
    });

    expect(valid).toBe(false);
  });
});
