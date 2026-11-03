"use client";

import { checkAuthAction } from "@/actions/auth.actions";
import { hasSessionCookie } from "./client-session";

let cachedAuthPromise: Promise<boolean> | null = null;

/**
 * Returns true if the current user session is authenticated.
 * Deduplicates concurrent client calls and short-circuits for guest visitors without auth cookies
 * to avoid blocking main thread hydration with redundant server actions.
 */
export function getClientAuth(): Promise<boolean> {
  if (typeof window === "undefined" || !hasSessionCookie()) {
    return Promise.resolve(false);
  }
  if (!cachedAuthPromise) {
    cachedAuthPromise = checkAuthAction().catch(() => false); // ignore: fallback to false on network failure
  }
  return cachedAuthPromise;
}

export function invalidateClientAuth(): void {
  cachedAuthPromise = null;
}
