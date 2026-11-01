import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/auth/roles";

/**
 * Checks whether the current session has satisfied MFA (AAL2 level) for administrative actions.
 * Fail-closed: any Supabase network failure or missing MFA returns false.
 */
export async function isAdminMfaSatisfied(): Promise<boolean> {
  if (process.env.ADMIN_MFA_REQUIRED === "false") return true;
  if (process.env.DATA_SOURCE === "mock" || process.env.NODE_ENV === "test") return true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    return data.currentLevel === "aal2";
  } catch {
    return false;
  }
}

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
