import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { PageProgressBar } from "@/components/shared/page-progress-bar";
import { Toaster } from "@/components/ui/sonner";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bijihub.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Biji Hub — Marketplace Kopi Specialty Indonesia",
    template: "%s | Biji Hub",
  },
  description:
    "Marketplace kopi specialty Indonesia yang mengutamakan kesegaran sangrai, ketertelusuran asal-usul, dan eksplorasi profil rasa terbaik nusantara.",
  keywords: [
    "kopi specialty",
    "biji kopi indonesia",
    "green beans indonesia",
    "roasted beans",
    "roastery lokal",
    "petani kopi nusantara",
    "marketplace kopi",
    "biji hub",
  ],
  openGraph: {
    title: "Biji Hub — Marketplace Kopi Specialty Indonesia",
    description:
      "Temukan biji kopi specialty terbaik langsung dari roastery dan kebun kopi lokal se-Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "Biji Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Biji Hub — Marketplace Kopi Specialty Indonesia",
    description:
      "Temukan biji kopi specialty terbaik langsung dari roastery dan kebun kopi lokal se-Indonesia.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${jakarta.variable}`}
    >
      <body className="font-sans bg-background text-foreground antialiased min-h-screen">
        <Providers>
          <PageProgressBar />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
