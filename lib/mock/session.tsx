"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type Role = "guest" | "buyer" | "seller" | "admin";

interface Session {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
}

const SessionContext = createContext<Session>({ role: "guest", login: () => {}, logout: () => {} });

const STORAGE_KEY = "biji-mock-session";

export function SessionProvider({ children, initialRole = "guest" }: { children: ReactNode; initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (stored && ["guest", "buyer", "seller", "admin"].includes(stored)) {
        setRole(stored);
      }
    } catch {}
  }, []);

  const login = useCallback((r: Role) => {
    setRole(r);
    try { localStorage.setItem(STORAGE_KEY, r); } catch {}
  }, []);

  const logout = useCallback(() => {
    setRole("guest");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <SessionContext.Provider value={{ role, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

declare global {
  interface Window {
    __biji_setRole?: (role: string) => void;
    __biji_clearRole?: () => void;
  }
}

if (typeof window !== "undefined") {
  window.__biji_setRole = (r: string) => {
    if (["guest", "buyer", "seller", "admin"].includes(r)) {
      try { localStorage.setItem(STORAGE_KEY, r); } catch {}
      window.location.reload();
    }
  };
  window.__biji_clearRole = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    window.location.reload();
  };
}
