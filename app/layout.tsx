import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bijihub.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Biji Hub — Direktori & Katalog Kopi Specialty Indonesia",
    template: "%s | Biji Hub",
  },
  description:
    "Direktori kopi specialty Indonesia. Hubungkan petani, roastery, dan processor lokal langsung dengan kedai kopi dan penikmat kopi tanpa komisi.",
  keywords: [
    "kopi specialty",
    "biji kopi indonesia",
    "green beans indonesia",
    "roasted beans",
    "roastery lokal",
    "petani kopi nusantara",
    "direktori kopi",
    "biji hub",
  ],
  openGraph: {
    title: "Biji Hub — Direktori & Katalog Kopi Specialty Indonesia",
    description:
      "Temukan biji kopi specialty terbaik langsung dari roastery dan kebun kopi lokal se-Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "Biji Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Biji Hub — Direktori & Katalog Kopi Specialty Indonesia",
    description:
      "Temukan biji kopi specialty terbaik langsung dari roastery dan kebun kopi lokal se-Indonesia.",
  },
};

const snapScriptUrl =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${jakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-sans bg-background text-foreground antialiased min-h-screen">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
        {clientKey && (
          <Script
            src={snapScriptUrl}
            data-client-key={clientKey}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
