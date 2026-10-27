import { describe, it, expect } from "vitest";
import { createNonce } from "./nonce";

describe("createNonce (B3)", () => {
  it("generates a raw base64 string and a 64-char hex SHA-256 digest", async () => {
    const { raw, hashed } = await createNonce();

    expect(typeof raw).toBe("string");
    expect(raw.length).toBeGreaterThanOrEqual(40);

    expect(typeof hashed).toBe("string");
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces distinct nonces on subsequent calls", async () => {
    const nonce1 = await createNonce();
    const nonce2 = await createNonce();

    expect(nonce1.raw).not.toBe(nonce2.raw);
    expect(nonce1.hashed).not.toBe(nonce2.hashed);
  });

  it("produces a hashed value matching the SHA-256 of the raw string", async () => {
    const { raw, hashed } = await createNonce();

    const expectedDigest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(raw),
    );
    const expectedHex = Array.from(new Uint8Array(expectedDigest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    expect(hashed).toBe(expectedHex);
  });
});
