"use client";

import { MessageCircle, FileText } from "lucide-react";
import { buildWhatsAppUrl } from "@/components/shared/whatsapp-button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/tracking";

interface Props {
  phoneNumber: string;
  listingId: string;
  listingTitle: string;
  sellerName: string;
  className?: string;
}

export function ProductStickyCTA({
  phoneNumber,
  listingId,
  listingTitle,
  sellerName,
  className,
}: Props) {
  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber,
    listingId,
    listingTitle,
    sellerName,
  });

  const scrollToInquiry = () => {
    document
      .getElementById("inquiry-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 border-t border-neutral-300 bg-surface-base md:hidden",
        className,
      )}
    >
      <div className="flex items-stretch divide-x divide-neutral-300">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent(listingId, "contact_click")}
          className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary-600 text-white text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={scrollToInquiry}
          className="flex-1 flex items-center justify-center gap-2 h-12 bg-transparent text-primary-700 text-sm font-medium border border-primary-700"
        >
          <FileText className="w-4 h-4 shrink-0" />
          Inquiry B2B
        </button>
      </div>
    </div>
  );
}
