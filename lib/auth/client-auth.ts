"use client";

import { checkAuthAction } from "@/actions/auth.actions";

let cachedAuthPromise: Promise<boolean> | null = null;

/**
 * Returns true if the current user session is authenticated.
 * Deduplicates concurrent client calls so multiple components (e.g. multiple listing cards)
 * share a single check instead of flooding the server with parallel requests.
 */
export function getClientAuth(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if (!cachedAuthPromise) {
    cachedAuthPromise = checkAuthAction().catch(() => false);
  }
  return cachedAuthPromise;
}

export function invalidateClientAuth(): void {
  cachedAuthPromise = null;
}
