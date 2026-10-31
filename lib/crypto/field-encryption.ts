import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  let raw = process.env.PAYOUT_ENC_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PAYOUT_ENC_KEY harus disetel pada production");
    }
    // Deterministic dev fallback key (32 bytes)
    raw = Buffer.from("0123456789abcdef0123456789abcdef").toString("base64");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("PAYOUT_ENC_KEY harus 32 byte (base64)");
  return key;
}

export function encryptField(plain: string): string {
  if (!plain) return "";
  if (plain.startsWith("v1.")) return plain; // Already encrypted
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptField(payload: string): string {
  if (!payload) return "";
  if (!payload.startsWith("v1.")) return payload; // Legacy unencrypted plaintext
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) {
    throw new Error("Format data terenkripsi tidak valid");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export function maskAccountNumber(acc: string): string {
  if (!acc) return "";
  let plain = acc;
  if (acc.startsWith("v1.")) {
    try {
      plain = decryptField(acc);
    } catch {
      plain = acc;
    }
  }
  const last4 = plain.slice(-4);
  return `••••${last4}`;
}
