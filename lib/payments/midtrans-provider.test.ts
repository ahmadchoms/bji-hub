import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  mapMidtransStatus,
  midtransProvider,
} from "./midtrans-provider";

const TEST_KEY = "test-midtrans-secret";

describe("midtrans-provider status mapping", () => {
  it("maps settlement to paid", () => {
    expect(mapMidtransStatus("settlement")).toBe("paid");
  });

  it("maps capture with normal/accept status to paid", () => {
    expect(mapMidtransStatus("capture", "accept")).toBe("paid");
    expect(mapMidtransStatus("capture")).toBe("paid");
  });

  it("maps capture with challenge fraud status to pending", () => {
    expect(mapMidtransStatus("capture", "challenge")).toBe("pending");
  });

  it("maps capture with deny fraud status to failed", () => {
    expect(mapMidtransStatus("capture", "deny")).toBe("failed");
  });

  it("maps pending to pending", () => {
    expect(mapMidtransStatus("pending")).toBe("pending");
  });

  it("maps deny to failed", () => {
    expect(mapMidtransStatus("deny")).toBe("failed");
  });

  it("maps cancel to canceled", () => {
    expect(mapMidtransStatus("cancel")).toBe("canceled");
  });

  it("maps expire to expired", () => {
    expect(mapMidtransStatus("expire")).toBe("expired");
  });

  it("maps unknown status to pending fallback", () => {
    expect(mapMidtransStatus("something_else")).toBe("pending");
    expect(mapMidtransStatus(undefined)).toBe("pending");
  });
});

describe("midtrans-provider parseWebhook", () => {
  beforeEach(() => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function makeSignature(orderId: string, statusCode: string, amount: string) {
    return crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${amount}${TEST_KEY}`)
      .digest("hex");
  }

  it("successfully parses valid settlement webhook", async () => {
    const orderId = "ORD-123";
    const statusCode = "200";
    const amount = "150000";
    const signature = makeSignature(orderId, statusCode, amount);

    const payload = JSON.stringify({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: amount,
      signature_key: signature,
      transaction_status: "settlement",
    });

    const parsed = await midtransProvider.parseWebhook(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.orderRef).toBe(orderId);
    expect(parsed?.status).toBe("paid");
    expect(parsed?.amount).toBe(150000);
  });

  it("parses capture with fraud_status=challenge as pending", async () => {
    const orderId = "ORD-456";
    const statusCode = "200";
    const amount = "200000.00";
    const signature = makeSignature(orderId, statusCode, amount);

    const payload = JSON.stringify({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: amount,
      signature_key: signature,
      transaction_status: "capture",
      fraud_status: "challenge",
    });

    const parsed = await midtransProvider.parseWebhook(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.orderRef).toBe(orderId);
    expect(parsed?.status).toBe("pending");
    expect(parsed?.amount).toBe(200000);
  });

  it("rejects invalid signature with null", async () => {
    const payload = JSON.stringify({
      order_id: "ORD-999",
      status_code: "200",
      gross_amount: "100000",
      signature_key: "invalid-signature-key",
      transaction_status: "settlement",
    });

    const parsed = await midtransProvider.parseWebhook(payload);
    expect(parsed).toBeNull();
  });

  it("returns null for malformed JSON or missing fields", async () => {
    expect(await midtransProvider.parseWebhook("not json")).toBeNull();
    expect(await midtransProvider.parseWebhook(JSON.stringify({}))).toBeNull();
  });
});
