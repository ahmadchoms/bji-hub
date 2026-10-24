"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/roles";

interface GoogleSignInButtonProps {
  next?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({ next = "/" }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisReady, setGisReady] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setPending(true);
      setError(null);
      try {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });

        if (signInError) {
          setError("Gagal login dengan Google. Silakan coba lagi.");
          setPending(false);
          return;
        }

        window.location.href = safeNextPath(next, "/");
      } catch {
        setError("Gagal login dengan Google. Silakan coba lagi.");
        setPending(false);
      }
    },
    [next],
  );

  const callbackRef = useRef(handleCredentialResponse);
  useEffect(() => {
    callbackRef.current = handleCredentialResponse;
  }, [handleCredentialResponse]);

  const initGis = useCallback(() => {
    if (!clientId || !window.google?.accounts?.id || !buttonContainerRef.current) {
      return;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => callbackRef.current(res),
        cancel_on_tap_outside: true,
      });

      const containerWidth = buttonContainerRef.current.clientWidth || 360;
      const safeWidth = Math.min(400, Math.max(200, Math.floor(containerWidth)));
      const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

      buttonContainerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: "standard",
        theme: isDark ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: safeWidth,
        locale: "id",
      });

      setGisReady(true);
      window.google.accounts.id.prompt();
    } catch {
      setGisReady(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      initGis();
    }
  }, [initGis]);

  async function handleOAuthClick() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signInError) {
        setError("Gagal memulai login Google. Silakan coba lagi.");
        setPending(false);
      }
    } catch {
      setError("Gagal memulai login Google. Silakan coba lagi.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {clientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGis}
        />
      ) : null}

      <div
        ref={buttonContainerRef}
        className={`w-full flex justify-center ${gisReady && !pending ? "block" : "hidden"}`}
      />

      {(!gisReady || pending) && (
        <button
          type="button"
          onClick={handleOAuthClick}
          disabled={pending}
          aria-busy={pending}
          className="min-h-11 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 text-sm font-medium text-neutral-800 dark:text-neutral-200 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>
            {pending
              ? "Memproses login Google…"
              : "Lanjutkan dengan Google"}
          </span>
        </button>
      )}

      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
