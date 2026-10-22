/**
 * Sanitizes display name extracted from OAuth metadata or user input.
 * Ensures the name is between 2 and 100 characters, normalizes whitespace,
 * and falls back to email local part or "User" if missing or invalid.
 */
export function sanitizeDisplayName(
  raw?: unknown,
  emailFallback?: string,
): string {
  const fallback = (emailFallback ? emailFallback.split("@")[0] : "").trim() || "User";

  if (typeof raw !== "string") {
    return fallback;
  }

  const normalized = raw.replace(/\s+/g, " ").trim();

  if (normalized.length < 2) {
    return fallback;
  }

  if (normalized.length > 100) {
    const truncated = normalized.slice(0, 100).trim();
    return truncated.length >= 2 ? truncated : fallback;
  }

  return normalized;
}
