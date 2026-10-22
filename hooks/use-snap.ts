"use client";

import { useState, useEffect, useCallback } from "react";

export interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

export interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, options?: SnapCallbacks) => void;
  };
}

export function useSnap() {
  const [ready, setReady] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as unknown as SnapWindow).snap);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const snapWin = window as unknown as SnapWindow;
    if (snapWin.snap) {
      setReady(true);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (snapWin.snap) {
        setReady(true);
        clearInterval(interval);
      } else if (Date.now() - start > 5000) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const pay = useCallback(
    (token: string, options?: SnapCallbacks): boolean => {
      if (typeof window === "undefined") return false;
      const snapWin = window as unknown as SnapWindow;
      if (!snapWin.snap) return false;
      try {
        snapWin.snap.pay(token, options);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  return { ready, pay };
}
