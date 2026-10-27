/**
 * Cryptographic nonce generator for OAuth ID token flow (Google Identity Services).
 * Mitigates token replay attacks by pairing a SHA-256 hash passed to Google with
 * the raw base64 string verified by Supabase Auth.
 */
export async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const rawBytes = new Uint8Array(32);
  crypto.getRandomValues(rawBytes);
  const raw = btoa(String.fromCharCode(...rawBytes));

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);

  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { raw, hashed };
}
