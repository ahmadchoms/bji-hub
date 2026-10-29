"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function PageProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const done = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setProgress(100);
    setIsLoading(false);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 250);
  }, []);

  const start = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setIsVisible(true);
    setIsLoading(true);
    setProgress(25);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 60) return prev + 15;
        if (prev < 80) return prev + 5;
        if (prev < 92) return prev + 1;
        return prev;
      });
    }, 250);

    timeoutRef.current = setTimeout(() => {
      done();
    }, 12000);
  }, [done]);

  useEffect(() => {
    done();
  }, [pathname, searchParams, done]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.hasAttribute("download") ||
        target.getAttribute("target") === "_blank"
      ) {
        return;
      }

      try {
        const dest = new URL(target.href, window.location.href);
        const current = new URL(window.location.href);

        if (dest.origin !== current.origin) return;

        if (dest.pathname === current.pathname && dest.search === current.search) {
          return;
        }

        start();
      } catch {
        // ignore: browser history manipulation fallback
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      start();
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [start]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-amber-600 via-primary-700 to-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.7)]" />
      </div>

      <div
        className="fixed top-3 right-4 z-[99999] pointer-events-none transition-opacity duration-200"
        style={{ opacity: isLoading ? 1 : 0 }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 text-white text-xs font-medium shadow-md backdrop-blur-xs">
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          <span>Memuat...</span>
        </div>
      </div>
    </>
  );
}

export function PageProgressBar() {
  return (
    <Suspense fallback={null}>
      <PageProgressBarInner />
    </Suspense>
  );
}
