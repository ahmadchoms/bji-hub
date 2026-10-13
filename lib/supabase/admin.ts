import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin client with service role key.
 * Used for admin auth operations like auto-confirming users during registration.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
