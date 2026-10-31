import { describe, it, expect } from "vitest";
import {
  encryptField,
  decryptField,
  maskAccountNumber,
} from "./field-encryption";

describe("Field Encryption (AES-256-GCM)", () => {
  it("encrypts and decrypts field roundtrip correctly", () => {
    const rawNumber = "1234567890123";
    const encrypted = encryptField(rawNumber);

    expect(encrypted).not.toBe(rawNumber);
    expect(encrypted.startsWith("v1.")).toBe(true);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(rawNumber);
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(encryptField("")).toBe("");
    expect(decryptField("")).toBe("");
    expect(maskAccountNumber("")).toBe("");
  });

  it("rejects corrupted encrypted payloads", () => {
    expect(() => decryptField("v1.invalid.format")).toThrow(
      "Format data terenkripsi tidak valid"
    );
    expect(() => decryptField("v1.badiv.badtag.baddata")).toThrow();
  });

  it("masks account number to last 4 digits for both encrypted and plain strings", () => {
    const rawNumber = "5420198823";
    expect(maskAccountNumber(rawNumber)).toBe("••••8823");

    const encrypted = encryptField(rawNumber);
    expect(maskAccountNumber(encrypted)).toBe("••••8823");
  });

  it("does not double-encrypt an already encrypted string", () => {
    const raw = "987654321";
    const enc1 = encryptField(raw);
    const enc2 = encryptField(enc1);
    expect(enc2).toBe(enc1);
    expect(decryptField(enc2)).toBe(raw);
  });
});
