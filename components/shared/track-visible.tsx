"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracking";
import type { TrackEventType } from "@/lib/validations/track.schema";

interface TrackVisibleProps {
  listingId: string;
  type: TrackEventType;
  threshold?: number;
  dwellMs?: number;
}

/** Place inside a `relative` parent. Fires once after the parent is mostly visible for `dwellMs`. */
export function TrackVisible({
  listingId,
  type,
  threshold = 0.5,
  dwellMs = 1000,
}: TrackVisibleProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (entry.intersectionRatio >= threshold) {
          timer = setTimeout(() => {
            trackEvent(listingId, type);
            observer.disconnect();
          }, dwellMs);
        }
      },
      { threshold },
    );
    observer.observe(el);

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [listingId, type, threshold, dwellMs]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}

export function TrackOnMount({
  listingId,
  type,
}: {
  listingId: string;
  type: TrackEventType;
}) {
  useEffect(() => {
    trackEvent(listingId, type);
  }, [listingId, type]);
  return null;
}
