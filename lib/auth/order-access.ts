import { timingSafeEqual } from "crypto";
import type { Session } from "@/lib/auth/roles";

export interface AccessibleOrder {
  buyerId?: string | null;
  sellerId: string;
  accessToken?: string | null;
}

function tokenMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function canAccessOrder(
  order: AccessibleOrder,
  session: Session,
  token?: string | null,
): boolean {
  if (session.role === "admin") return true;
  if (session.sellerId && order.sellerId === session.sellerId) return true;
  if (session.userId && order.buyerId && order.buyerId === session.userId) {
    return true;
  }
  if (token && order.accessToken) {
    return tokenMatches(order.accessToken, token);
  }
  return false;
}
