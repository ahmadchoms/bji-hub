import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/auth/roles";

/**
 * Fetch authenticator assurance level from Supabase.
 * Cached per request via React cache to deduplicate calls across middleware, guards, and actions.
 */
export const getAdminAalLevel = cache(async (): Promise<{ currentLevel: string | null; nextLevel: string | null } | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return null;
    return { currentLevel: data.currentLevel ?? null, nextLevel: data.nextLevel ?? null };
  } catch {
    return null;
  }
});

/**
 * Checks whether the current session has satisfied MFA (AAL2 level) for administrative actions.
 * Fail-closed: any Supabase network failure or missing MFA returns false.
 * Cached per request to eliminate redundant network calls.
 */
export const isAdminMfaSatisfied = cache(async (): Promise<boolean> => {
  if (process.env.ADMIN_MFA_REQUIRED === "false") return true;
  if (process.env.DATA_SOURCE === "mock" || process.env.NODE_ENV === "test") return true;
  const aal = await getAdminAalLevel();
  return aal?.currentLevel === "aal2";
});

/**
 * The single source of truth for checking if an actor is authorized to act as an admin.
 * Requires both the "admin" role and verified MFA assurance.
 */
export async function isAdminAllowed(session: Session | null | undefined): Promise<boolean> {
  if (!session || session.role !== "admin") return false;
  return isAdminMfaSatisfied();
}

/** Helper to check purely if session has admin role, for use during MFA enrollment / verification challenge */
export function hasAdminRole(session: Session | null | undefined): boolean {
  return session?.role === "admin";
}
