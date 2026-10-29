"use client";

import { useState } from "react";
import { Coffee, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildWhatsAppUrl } from "@/components/shared/whatsapp-button";
import { trackEvent } from "@/lib/tracking";
import { submitInquiryAction } from "@/actions/inquiry.actions";
import { toast } from "sonner";

interface SampleRequestModalProps {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerPhone: string;
  className?: string;
}

export function SampleRequestModal({
  listingId,
  listingTitle,
  sellerName,
  sellerPhone,
  className,
}: SampleRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [requestType, setRequestType] = useState<"100g" | "250g" | "500g" | "wholesale">("100g");
  const [beanFormat, setBeanFormat] = useState<"Green Beans" | "Roasted Beans">(
    "Green Beans",
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !businessName.trim() || !city.trim()) {
      toast.error("Mohon lengkapi semua data permintaan.");
      return;
    }

    setSubmitting(true);
    try {
      const isWholesale = requestType === "wholesale";
      const reqLabel = isWholesale
        ? "Penawaran Grosir / Bulk (>30kg)"
        : `Sampel ${requestType} (${beanFormat})`;
      const inquiryMessage = isWholesale
        ? `Permintaan surat penawaran harga grosir resmi untuk ${businessName.trim()} di ${city.trim()}.`
        : `Permintaan sampel ${requestType} (${beanFormat}) untuk uji rasa ${businessName.trim()} di ${city.trim()}. Siap tanggung ongkir.`;

      // 1. Simpan sebagai inquiry di dashboard seller
      await submitInquiryAction({
        listingId,
        buyerName: `${buyerName.trim()} (${businessName.trim()})`,
        buyerContact: city.trim(),
        quantity: reqLabel,
        message: inquiryMessage,
      });

      // 2. Track event analytics
      trackEvent(listingId, "contact_click");

      // 3. Format pesan WhatsApp terstruktur
      const customMessage = isWholesale
        ? `Halo ${sellerName}, saya ${buyerName.trim()} dari ${businessName.trim()} (${city.trim()}). Kami tertarik memesan partai besar untuk produk: "${listingTitle}". Mohon kirimkan surat penawaran harga grosir resmi (quotation) dan estimasi ongkir kargo ke ${city.trim()}. Terima kasih!`
        : `Halo ${sellerName}, saya ${buyerName.trim()} dari ${businessName.trim()} (${city.trim()}). Saya mengajukan permintaan sampel ${requestType} (${beanFormat}) untuk produk: "${listingTitle}". Biaya ongkos kirim ke ${city.trim()} siap saya tanggung. Mohon info ketersediaannya. Terima kasih!`;

      const waUrl = buildWhatsAppUrl({
        phoneNumber: sellerPhone,
        listingId,
        listingTitle,
        sellerName,
        customMessage,
      });

      setOpen(false);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      toast.success(
        isWholesale
          ? "Permintaan penawaran grosir terkirim via WhatsApp!"
          : "Permintaan sampel berhasil diajukan via WhatsApp!",
      );
    } catch {
      // ignore: UI error toast already handled
      toast.error("Gagal mengirim permintaan, coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full h-10 px-4 rounded-sm border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors",
              className,
            )}
          />
        }
      >
        <Coffee className="w-4 h-4 text-neutral-600 shrink-0" />
        <span>Minta Sampel & Penawaran Grosir B2B</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              B2B & Roastery Direct
            </span>
          </div>
          <DialogTitle className="font-display text-lg text-primary-900 font-semibold">
            Permintaan Sampel & Penawaran Grosir
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-600">
            Khusus roastery, kedai kopi, dan pembeli partai besar langsung ke petani/prosesor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Nama Lengkap <span className="text-destructive">*</span>
            </label>
            <Input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Nama Kedai / Roastery <span className="text-destructive">*</span>
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Kopi Seduh Senja"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Kota Pengiriman (untuk cek ongkir){" "}
              <span className="text-destructive">*</span>
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Bandung, Jawa Barat"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Jenis Permintaan B2B
            </label>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { id: "100g", label: "Sampel 100g (Cupping)" },
                { id: "250g", label: "Sampel 250g (Roast)" },
                { id: "500g", label: "Sampel 500g (Espresso)" },
                { id: "wholesale", label: "Penawaran Grosir (>30kg)" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRequestType(item.id as typeof requestType)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-sm border text-center transition-colors ${
                    requestType === item.id
                      ? "border-primary-600 bg-primary-50 text-primary-900 font-semibold"
                      : "border-neutral-300 bg-surface-base text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-800">
              Format Biji
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBeanFormat("Green Beans")}
                className={`py-2 px-3 text-xs font-medium rounded-sm border text-center transition-colors ${
                  beanFormat === "Green Beans"
                    ? "border-primary-600 bg-primary-50 text-primary-900 font-semibold"
                    : "border-neutral-300 bg-surface-base text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Green Beans (Mentah)
              </button>
              <button
                type="button"
                onClick={() => setBeanFormat("Roasted Beans")}
                className={`py-2 px-3 text-xs font-medium rounded-sm border text-center transition-colors ${
                  beanFormat === "Roasted Beans"
                    ? "border-primary-600 bg-primary-50 text-primary-900 font-semibold"
                    : "border-neutral-300 bg-surface-base text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Roasted Beans (Sangrai)
              </button>
            </div>
          </div>

          {/* Info Banner Biaya Ongkir / Info B2B */}
          <div className="rounded-sm bg-neutral-100 p-3 text-xs text-neutral-600 leading-relaxed border border-neutral-200">
            <p className="font-semibold text-neutral-800 mb-0.5">
              💡 Catatan Layanan:
            </p>
            {requestType === "wholesale"
              ? "Penjual akan menyiapkan rincian penawaran tier harga karungan dan kalkulasi ekspedisi kargo (JNE Trucking/Dakota Cargo) ke lokasi Anda."
              : `Biji sampel ${requestType} disediakan langsung oleh penjual. Biaya ongkir ke kota Anda ditanggung oleh pemohon sampel.`}
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="w-full gap-2 mt-2"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Permintaan via WhatsApp</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
