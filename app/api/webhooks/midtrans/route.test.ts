process.env.DATA_SOURCE = "mock";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import crypto from "crypto";

const TEST_KEY = "test-midtrans-server-key";

describe("POST /api/webhooks/midtrans", () => {
  beforeEach(() => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", TEST_KEY);
    vi.stubEnv("DATA_SOURCE", "mock");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function makeSignature(orderId: string, statusCode: string, grossAmount: string) {
    return crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${TEST_KEY}`)
      .digest("hex");
  }

  it("returns 401 on invalid signature", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify({
        order_id: "ORD-123",
        status_code: "200",
        gross_amount: "100000",
        signature_key: "invalid_sig",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 for Midtrans Dashboard Test Notification Ping", async () => {
    const orderId = "payment_notif_test_M120624626_770a9039-d06b-4ff0-9404-6069ac5dd7f6";
    const statusCode = "200";
    const grossAmount = "105000.00";
    const signatureKey = makeSignature(orderId, statusCode, grossAmount);

    const req = new NextRequest("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: "settlement",
        fraud_status: "accept",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(body.mode).toBe("test_notification");
  });

  it("returns 200 ignored for unknown order in mock mode", async () => {
    const orderId = "UNKNOWN-ORDER-999";
    const statusCode = "200";
    const grossAmount = "50000.00";
    const signatureKey = makeSignature(orderId, statusCode, grossAmount);

    const req = new NextRequest("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: "settlement",
        fraud_status: "accept",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("returns 200 with ignored: 'already_processed' when identical webhook event is replayed (S5)", async () => {
    const orderId = "ORD-REPLAY-101";
    const statusCode = "200";
    const grossAmount = "75000.00";
    const signatureKey = makeSignature(orderId, statusCode, grossAmount);

    const payload = JSON.stringify({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: "settlement",
      fraud_status: "accept",
    });

    const req1 = new NextRequest("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: payload,
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);

    const req2 = new NextRequest("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: payload,
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.ignored).toBe("already_processed");
  });
});
