import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_SESSION,
  isRole,
  type Role,
  type Session,
} from "@/lib/auth/roles";
import { asUserId, asSellerProfileId } from "@/types/ids";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDisplayName } from "@/lib/auth/display-name";
import { getPrisma } from "@/lib/data/prisma/client";
import { isMockAuthAllowed, MOCK_SESSION_COOKIE } from "@/lib/auth/mock-guard";

export { MOCK_SESSION_COOKIE };
const MOCK_SELLER_ID = "seller-1";

/**
 * Single entry point for session verification.
 * Supports Supabase Auth when cookies exist, with graceful fallback to mock session.
 * Wrapped in React cache to ensure only one session resolution per request render.
 */
export const getSession = cache(async (): Promise<Session> => {
  let store: Awaited<ReturnType<typeof cookies>>;
  try {
    store = await cookies();
  } catch {
    // ignore: cookies() might throw outside request lifecycle
    return GUEST_SESSION;
  }

  // 1. Check Supabase Auth session first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && process.env.DATA_SOURCE !== "mock") {
        const prisma = getPrisma();
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { sellerProfile: { select: { id: true, suspendedAt: true } } },
        });

        if (!dbUser) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email ?? "",
              role: "BUYER",
            },
          });
          dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { sellerProfile: { select: { id: true, suspendedAt: true } } },
          });
        }

        if (dbUser) {
          const roleMap: Record<string, Role> = {
            ADMIN: "admin",
            SELLER: "seller",
            BUYER: "buyer",
          };
          const role = roleMap[dbUser.role] || "buyer";
          const rawName = user.user_metadata?.full_name ?? user.user_metadata?.name;
          const cleanName = sanitizeDisplayName(rawName, dbUser.email);
          const isSuspended = Boolean(
            dbUser.suspendedAt || dbUser.sellerProfile?.suspendedAt,
          );
          return {
            role,
            sellerId: dbUser.sellerProfile?.id
              ? asSellerProfileId(dbUser.sellerProfile.id)
              : null,
            userId: asUserId(dbUser.id),
            email: dbUser.email,
            name: cleanName,
            isSuspended,
          };
        }
      }
    } catch {
      // ignore: Supabase auth throws when session cookie is missing or invalid
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
    sellerId: raw === "seller" ? asSellerProfileId(MOCK_SELLER_ID) : null,
    userId:
      raw === "seller"
        ? asUserId("user-seller-1")
        : raw === "admin"
          ? asUserId("user-admin-1")
          : asUserId("user-buyer-1"),
    email:
      raw === "seller"
        ? "seller@bijihub.com"
        : raw === "admin"
          ? "admin@bijihub.com"
          : "buyer@bijihub.com",
  };
});

export async function requireRole(
  allowed: readonly Role[],
  returnTo: string,
): Promise<Session> {
  const session = await getSession();
  if (session.isSuspended) {
    redirect(`/login?error=suspended`);
  }
  if (!allowed.includes(session.role)) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  // Admin MFA Enforcement (Audit #26 / E4)
  if (allowed.includes("admin") && session.role === "admin") {
    const isMock = process.env.DATA_SOURCE === "mock" || process.env.NODE_ENV === "test";
    const mfaRequired = process.env.ADMIN_MFA_REQUIRED !== "false";
    if (!isMock && mfaRequired && !returnTo.startsWith("/admin/mfa")) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal && aal.currentLevel !== "aal2") {
          redirect(aal.nextLevel === "aal2" ? "/admin/mfa/verify" : "/admin/mfa/enroll");
        }
      } catch (err) {
        if ((err as Error)?.message?.includes("NEXT_REDIRECT")) {
          throw err;
        }
      }
    }
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
