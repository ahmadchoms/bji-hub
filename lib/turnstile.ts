/**
 * Cloudflare Turnstile Server-Side Verification Helper.
 * Validates captcha response tokens with zero external dependencies.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In non-production environments without keys configured, bypass verification
  if (!secretKey) {
    return process.env.NODE_ENV !== "production";
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return false;

    const data: { success?: boolean } = await res.json();
    return Boolean(data.success);
  } catch {
    // ignore: verification timeout or network failure
    return false;
  }
}
