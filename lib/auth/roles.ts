export const ROLES = ["guest", "buyer", "seller", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface Session {
  role: Role;
  sellerId: string | null;
}

export const GUEST_SESSION: Session = { role: "guest", sellerId: null };

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/dashboard";
  return "/";
}

/** Only same-origin relative paths are allowed as post-login targets. */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string,
): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  )
    return fallback;
  return next;
}

/** Demo-only rule until real auth exists: the email prefix decides the role. */
export function mockRoleFromEmail(email: string): Role {
  const local = email.trim().toLowerCase();
  if (local.startsWith("admin")) return "admin";
  if (local.startsWith("buyer")) return "buyer";
  return "seller";
}
