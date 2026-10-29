"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/lib/auth/roles";

export interface NavbarAuthState {
  isLoading: boolean;
  authenticated: boolean;
  role: Role;
  user: {
    firstName: string;
    avatarUrl?: string;
  } | null;
  storeName: string | null;
  activeOrdersCount: number;
  unreadCount: number;
}

export const GUEST_NAVBAR_STATE: NavbarAuthState = {
  isLoading: false,
  authenticated: false,
  role: "guest",
  user: null,
  storeName: null,
  activeOrdersCount: 0,
  unreadCount: 0,
};

export const CACHE_KEY = "biji_me_cache";
export const CACHE_TTL_MS = 60 * 1000; // 60s

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)(?:sb-|-auth-token|biji-mock-session)/.test(document.cookie);
}

export function getCachedAuth(): NavbarAuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp: number; data: NavbarAuthState };
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed.data;
    }
  } catch {
    // ignore: sessionStorage reading error
  }
  return null;
}

export function setCachedAuth(data: NavbarAuthState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore: sessionStorage writing error
  }
}

export function clearCachedAuth(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore: sessionStorage clear error
  }
}

export function useNavbarAuth(): NavbarAuthState {
  const [state, setState] = useState<NavbarAuthState>(() => {
    if (typeof window === "undefined") {
      return { ...GUEST_NAVBAR_STATE, isLoading: true };
    }
    if (!hasSessionCookie()) {
      return GUEST_NAVBAR_STATE;
    }
    const cached = getCachedAuth();
    if (cached) {
      return cached;
    }
    return { ...GUEST_NAVBAR_STATE, isLoading: true };
  });

  useEffect(() => {
    // Skip network request entirely if no session cookies are present
    if (!hasSessionCookie()) {
      clearCachedAuth();
      setState(GUEST_NAVBAR_STATE);
      return;
    }

    const cached = getCachedAuth();
    if (cached) {
      setState(cached);
    }

    let isMounted = true;
    let controller = new AbortController();

    const fetchSession = async () => {
      if (!hasSessionCookie()) {
        clearCachedAuth();
        if (isMounted) setState(GUEST_NAVBAR_STATE);
        return;
      }

      controller.abort();
      controller = new AbortController();

      try {
        const res = await fetch("/api/me", {
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!res.ok) {
          clearCachedAuth();
          if (isMounted) setState(GUEST_NAVBAR_STATE);
          return;
        }

        const data = await res.json();
        const nextState: NavbarAuthState = {
          isLoading: false,
          authenticated: Boolean(data.authenticated),
          role: (data.role as Role) || (data.authenticated ? "buyer" : "guest"),
          user: data.user || null,
          storeName: data.storeName || null,
          activeOrdersCount: Number(data.activeOrdersCount) || 0,
          unreadCount: Number(data.unreadCount) || 0,
        };

        if (isMounted) {
          setState(nextState);
          setCachedAuth(nextState);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    if (!cached) {
      void fetchSession();
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!hasSessionCookie()) {
          clearCachedAuth();
          setState(GUEST_NAVBAR_STATE);
        } else if (!getCachedAuth()) {
          void fetchSession();
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return state;
}
