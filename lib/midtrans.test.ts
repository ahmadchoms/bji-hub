import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyMidtransSignature, mapMidtransStatus } from "./midtrans";
import crypto from "crypto";

const TEST_SERVER_KEY = "mock-test-server-key";

describe("Midtrans Signature Verification", () => {
  beforeEach(() => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", TEST_SERVER_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verifies valid SHA-512 signature using configured server key", () => {
    const order_id = "ORDER-TEST-001";
    const status_code = "200";
    const gross_amount = "150000.00";
    const raw = `${order_id}${status_code}${gross_amount}${TEST_SERVER_KEY}`;
    const signature_key = crypto.createHash("sha512").update(raw).digest("hex");

    expect(
      verifyMidtransSignature({
        order_id,
        status_code,
        gross_amount,
        signature_key,
      }),
    ).toBe(true);
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

describe("mapMidtransStatus", () => {
  it("maps settlement and capture(accept) to paid", () => {
    expect(mapMidtransStatus("settlement")).toBe("paid");
    expect(mapMidtransStatus("capture", "accept")).toBe("paid");
    expect(mapMidtransStatus("capture", "challenge")).toBe("pending");
  });

  it("maps cancel, deny, and expire to failed", () => {
    expect(mapMidtransStatus("cancel")).toBe("failed");
    expect(mapMidtransStatus("deny")).toBe("failed");
    expect(mapMidtransStatus("expire")).toBe("failed");
    expect(mapMidtransStatus("pending")).toBe("pending");
  });
});
