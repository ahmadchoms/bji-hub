// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Sample 10% of transactions in production to conserve quota
  tracesSampleRate: 0.1,

  ignoreErrors: [
    // Next.js / React 19 Fizz streaming race condition on rapid client navigation ($RS completeSegment)
    "Cannot read properties of null (reading 'parentNode')",
    "$RS",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
  ],

  // Turns off collection of data that could identify users
  dataCollection: {
    userInfo: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    httpBodies: [],
    httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user", "authorization", "cookie"] },
    cookies: { deny: ["*"] },
    urlQueryParams: { deny: ["*"] },
  },

  beforeSend(event) {
    const errorValue = event.exception?.values?.[0]?.value || "";
    // Filter out React streaming unmount artifact ($RS parentNode null)
    if (errorValue.includes("parentNode") && errorValue.includes("null")) {
      return null;
    }
    return event;
  },
});
