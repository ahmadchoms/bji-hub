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

    const scriptId = "midtrans-snap-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      const isProd =
        process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
        process.env.MIDTRANS_IS_PRODUCTION === "true";
      const snapScriptUrl = isProd
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
      const clientKey =
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
        process.env.MIDTRANS_CLIENT_KEY;

      if (clientKey) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = snapScriptUrl;
        script.setAttribute("data-client-key", clientKey);
        script.async = true;
        document.body.appendChild(script);
      }
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (snapWin.snap) {
        setReady(true);
        clearInterval(interval);
      } else if (Date.now() - start > 10000) {
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
