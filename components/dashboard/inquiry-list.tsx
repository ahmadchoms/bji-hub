"use client";

import { Inquiry } from "@/types";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MessageCircle, Mail, Copy, Check, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface InquiryListProps {
  inquiries: Inquiry[];
  className?: string;
}

export function InquiryList({ inquiries, className }: InquiryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (inquiries.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Pesan"
        description="Pesan dan permintaan sampel dari calon pembeli B2B / roastery akan muncul di sini."
        className={className}
      />
    );
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Kontak pembeli berhasil disalin ke clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {inquiries.map((inq) => {
        const cleanPhone = inq.buyerContact.replace(/\D/g, "").replace(/^0/, "62");
        const isPhone = cleanPhone.length >= 9;
        const isEmail = inq.buyerContact.includes("@");

        const waText = encodeURIComponent(
          `Halo ${inq.buyerName}, kami dari tim roastery/petani di Biji Hub menindaklanjuti permintaan sampel dan penawaran kopi partai (${inq.quantity}) Anda. Apakah ada profil sangrai atau spesifikasi khusus yang Anda perlukan?`
        );

        return (
          <div
            key={inq.id}
            className="border border-neutral-300 bg-surface-base rounded-sm p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-neutral-900">{inq.buyerName}</p>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    B2B Lead
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-600 font-mono">{inq.buyerContact}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(inq.id, inq.buyerContact)}
                    className="text-neutral-400 hover:text-neutral-700 transition-colors"
                    title="Salin Kontak"
                  >
                    {copiedId === inq.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono shrink-0">
                {format(new Date(inq.createdAt), "d MMM yyyy, HH:mm", { locale: idLocale })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-sm">
                Kebutuhan: <span className="font-semibold">{inq.quantity}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap bg-neutral-50/70 p-3 rounded border border-neutral-200/60 font-sans">
              &ldquo;{inq.message}&rdquo;
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
              {isPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Balas via WhatsApp
                </a>
              )}

              {isEmail && (
                <a
                  href={`mailto:${inq.buyerContact}?subject=${encodeURIComponent(
                    `Penawaran & Sampel Kopi Biji Hub - ${inq.quantity}`
                  )}&body=${waText}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  Kirim Email Resmi
                </a>
              )}

              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Halo ${inq.buyerName}, berikut kami kirimkan draf Surat Penawaran / Kontrak Pembelian Partai Biji Hub untuk kuantitas ${inq.quantity}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors ml-auto"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-500" />
                Lanjut Kontrak Partai
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}