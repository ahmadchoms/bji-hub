"use client";

import { useState } from "react";
import { MessageCircle, Check, Sparkles } from "lucide-react";
import { buildWhatsAppUrl } from "@/components/shared/whatsapp-button";
import { trackEvent } from "@/lib/tracking";

interface B2BNegotiationBoxProps {
  phoneNumber: string;
  listingId: string;
  listingTitle: string;
  sellerName: string;
}

const TEMPLATES = [
  {
    id: "lot",
    label: "Cek Stok & Lot",
    badge: "Stok",
    getMessage: (title: string, seller: string, id: string) =>
      `Halo ${seller}, saya melihat listing kopi "${title}" (Ref #${id}) di Biji Corp. Apakah lot stok ini masih ready untuk dipesan? Terima kasih.`,
  },
  {
    id: "bulk",
    label: "Nego Partai Besar (Bulk)",
    badge: ">30kg",
    getMessage: (title: string, seller: string, id: string) =>
      `Halo ${seller}, saya tertarik melakukan pembelian partai besar (bulk/karungan) untuk produk "${title}" (Ref #${id}) di Biji Corp. Apakah ada penawaran tier harga khusus roastery?`,
  },
  {
    id: "crop",
    label: "Tanya Crop & Moisture",
    badge: "Spesifikasi",
    getMessage: (title: string, seller: string, id: string) =>
      `Halo ${seller}, saya ingin konfirmasi info musim panen (crop year), kadar air (moisture content), dan screen size untuk lot "${title}" (Ref #${id}). Terima kasih!`,
  },
];

export function B2BNegotiationBox({
  phoneNumber,
  listingId,
  listingTitle,
  sellerName,
}: B2BNegotiationBoxProps) {
  const [selectedId, setSelectedId] = useState("lot");

  const currentTemplate =
    TEMPLATES.find((t) => t.id === selectedId) || TEMPLATES[0];
  const customMessage = currentTemplate.getMessage(
    listingTitle,
    sellerName,
    listingId,
  );

  const url = buildWhatsAppUrl({
    phoneNumber,
    listingId,
    listingTitle,
    sellerName,
    customMessage,
  });

  return (
    <div className="space-y-3 p-3.5 rounded-xl border border-primary-200/80 bg-primary-50/40">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-600" />
          Template Chat B2B Langsung
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">Pilih topik</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => setSelectedId(tmpl.id)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all text-left flex items-center gap-1.5 ${
              selectedId === tmpl.id
                ? "bg-white border-primary-500 text-primary-800 font-medium shadow-xs"
                : "bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white hover:text-neutral-900"
            }`}
          >
            {selectedId === tmpl.id && <Check className="w-3 h-3 text-primary-600 shrink-0" />}
            <span>{tmpl.label}</span>
          </button>
        ))}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent(listingId, "contact_click")}
        className="w-full inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-xs"
      >
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span>Chat Penjual via WhatsApp ({currentTemplate.badge})</span>
      </a>
    </div>
  );
}
