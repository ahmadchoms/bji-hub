import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_SESSION,
  isRole,
  type Role,
  type Session,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { isMockAuthAllowed } from "@/lib/auth/mock-guard";

export { MOCK_SESSION_COOKIE } from "@/lib/auth/mock-guard";
const MOCK_SELLER_ID = "seller-1";

/**
 * Single entry point for session verification.
 * Supports Supabase Auth when cookies exist, with graceful fallback to mock session.
 */
export async function getSession(): Promise<Session> {
  let store: Awaited<ReturnType<typeof cookies>>;
  try {
    store = await cookies();
  } catch {
    return GUEST_SESSION;
  }

  // 1. Check Supabase Auth session first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && process.env.DATA_SOURCE !== "mock") {
        const prisma = getPrisma();
        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email ?? "",
            role:
              user.email === process.env.ADMIN_EMAIL
                ? "ADMIN"
                : user.user_metadata?.role === "seller"
                  ? "SELLER"
                  : "BUYER",
          },
          update: {},
          include: { sellerProfile: { select: { id: true } } },
        });

        if (dbUser) {
          const roleMap: Record<string, Role> = {
            ADMIN: "admin",
            SELLER: "seller",
            BUYER: "buyer",
          };
          const role = roleMap[dbUser.role] || "buyer";
          return {
            role,
            sellerId: dbUser.sellerProfile?.id ?? null,
            userId: dbUser.id,
            email: dbUser.email,
          };
        }
      }
    } catch {
      // Fall through to mock session if Supabase throws
    }
  }

  // 2. Mock session fallback (only allowed in test/dev or mock mode, never in production with DB)
  if (!isMockAuthAllowed()) {
    return GUEST_SESSION;
  }

  const raw = store.get(MOCK_SESSION_COOKIE)?.value;
  if (!isRole(raw) || raw === "guest") return GUEST_SESSION;
  return {
    role: raw,
    sellerId: raw === "seller" ? MOCK_SELLER_ID : null,
    userId:
      raw === "seller"
        ? "user-seller-1"
        : raw === "admin"
          ? "user-admin-1"
          : "user-buyer-1",
    email:
      raw === "seller"
        ? "seller@bijihub.com"
        : raw === "admin"
          ? "admin@bijihub.com"
          : "buyer@bijihub.com",
  };
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
