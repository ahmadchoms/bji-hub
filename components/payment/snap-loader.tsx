"use client";

import Script from "next/script";

export function SnapLoader() {
  const isProd =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapScriptUrl = isProd
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    process.env.MIDTRANS_CLIENT_KEY;

  if (!clientKey) {
    if (typeof window !== "undefined") {
      console.warn(
        "[SEC-4 Admin Warning] NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is missing. Payment gateway is unconfigured."
      );
    }
    return null;
  }

  return (
    <Script
      id="midtrans-snap-script"
      src={snapScriptUrl}
      data-client-key={clientKey}
      strategy="afterInteractive"
    />
  );
}
