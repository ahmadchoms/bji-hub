"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";

interface WhatsAppButtonProps {
  phoneNumber: string;
  listingId: string;
  listingTitle: string;
  sellerName?: string;
  unit?: string;
  price?: number;
  customMessage?: string;
  variant?: "primary" | "secondary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function normalizeWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    return "62" + cleaned.slice(1);
  }
  if (cleaned.startsWith("62")) {
    return cleaned;
  }
  return "62" + cleaned;
}

export function buildWhatsAppUrl({
  phoneNumber,
  listingId,
  listingTitle,
  sellerName,
  customMessage,
}: {
  phoneNumber: string;
  listingId: string;
  listingTitle: string;
  sellerName?: string;
  customMessage?: string;
}): string {
  const normalizedPhone = normalizeWhatsAppNumber(phoneNumber);
  const greeting = sellerName ? `Halo ${sellerName}, ` : "Halo, ";
  const defaultText = `${greeting}saya melihat listing kopi Anda "${listingTitle}" (Ref ID: #${listingId}) di Biji. Apakah stok ini masih tersedia dan bisa saya pesan? Terima kasih.`;
  const finalMessage = customMessage || defaultText;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(finalMessage)}`;
}

export function WhatsAppButton({
  phoneNumber,
  listingId,
  listingTitle,
  sellerName,
  customMessage,
  variant = "primary",
  size = "md",
  className,
  children,
}: WhatsAppButtonProps) {
  const url = buildWhatsAppUrl({
    phoneNumber,
    listingId,
    listingTitle,
    sellerName,
    customMessage,
  });

  const variantStyles = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary:
      "bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50",
    accent: "bg-accent-500 hover:bg-accent-700 text-white",
    outline:
      "border border-neutral-300 bg-surface-base text-neutral-900 hover:bg-neutral-100",
  };

  const sizeStyles = {
    sm: "h-9 min-h-[36px] px-3 text-xs gap-1.5 rounded-sm",
    md: "h-10 min-h-[40px] px-4 text-sm gap-2 rounded-sm",
    lg: "h-11 min-h-[44px] px-6 text-sm gap-2 rounded-sm",
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(listingId, "contact_click")}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 outline-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      aria-label={`Hubungi penjual via WhatsApp untuk listing ${listingTitle}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      <span>{children || "Hubungi Penjual"}</span>
    </a>
  );
}
