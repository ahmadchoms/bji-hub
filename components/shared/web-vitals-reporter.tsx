"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // 10% sampling to keep observability high-signal and lightweight
    if (Math.random() > 0.1) return;

    if (["LCP", "CLS", "INP", "TTFB", "FCP"].includes(metric.name)) {
      import("@sentry/nextjs")
        .then((Sentry) => {
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
        })
        .catch(() => {});
    }
  });

  return null;
}
