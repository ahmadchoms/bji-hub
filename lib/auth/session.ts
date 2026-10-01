import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_SESSION,
  isRole,
  type Role,
  type Session,
} from "@/lib/auth/roles";

export const MOCK_SESSION_COOKIE = "biji-mock-session";
const MOCK_SELLER_ID = "seller-1";

/** Single entry point for "who is the current user". Swap the body for the real auth provider later. */
export async function getSession(): Promise<Session> {
  const store = await cookies();
  const raw = store.get(MOCK_SESSION_COOKIE)?.value;
  if (!isRole(raw) || raw === "guest") return GUEST_SESSION;
  return { role: raw, sellerId: raw === "seller" ? MOCK_SELLER_ID : null };
}

export async function requireRole(
  allowed: readonly Role[],
  returnTo: string,
): Promise<Session> {
  const session = await getSession();
  if (!allowed.includes(session.role)) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

export async function requireSeller(
  returnTo = "/dashboard",
): Promise<{ session: Session; sellerId: string }> {
  const session = await requireRole(["seller"], returnTo);
  if (!session.sellerId)
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return { session, sellerId: session.sellerId };
}
