// This file configures the initialization of Sentry for edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,

  tracesSampleRate: 0.1,

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
    const scrub = (text?: string) =>
      text
        ?.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
        .replace(/\b(?:\+62|0)8\d{8,12}\b/g, "[telepon]");

    if (event.message) event.message = scrub(event.message);
    event.exception?.values?.forEach((v) => {
      if (v.value) v.value = scrub(v.value);
    });

    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    return event;
  },
});
