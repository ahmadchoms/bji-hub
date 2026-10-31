"use client";

import { useReportWebVitals } from "next/web-vitals";
import * as Sentry from "@sentry/nextjs";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // 10% sampling to keep observability high-signal and lightweight
    if (Math.random() > 0.1) return;

    if (["LCP", "CLS", "INP", "TTFB", "FCP"].includes(metric.name)) {
      try {
        Sentry.captureMessage(`web_vitals.${metric.name.toLowerCase()}`, {
          level: "info",
          extra: {
            id: metric.id,
            name: metric.name,
            startTime: metric.startTime,
            value: metric.value,
            rating: metric.rating,
          },
        });
      } catch {
        // ignore: reporting failure should never disrupt page experience
      }
    }
  });

  return null;
}
