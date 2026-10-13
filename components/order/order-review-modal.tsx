"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitReviewAction } from "@/actions/order.actions";
import { uploadImage } from "@/lib/upload-client";
import { toast } from "sonner";
import { Star, Loader2, Camera, X } from "lucide-react";

interface OrderReviewModalProps {
  orderId: string;
  listingId: string;
  listingTitle: string;
}

export function OrderReviewModal({
  orderId,
  listingId,
  listingTitle,
}: OrderReviewModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      setImageUrl(res.url);
      toast.success("Foto ulasan berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto ulasan");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await submitReviewAction({
        orderId,
        listingId,
        rating,
        comment,
        imageUrl,
      });

      if (res.success) {
        toast.success("Ulasan Anda berhasil dikirim! Terima kasih atas feedback-nya.");
        setSubmitted(true);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengirimkan ulasan");
      }
    });
  };

  if (submitted) {
    return (
      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        Ulasan Terkirim
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100 h-8 gap-1.5"
      >
        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        Beri Ulasan Kopi
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              Ulasan Kopi: {listingTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Bagikan pengalaman seduhan dan profil rasa kopi yang Anda terima kepada penikmat kopi lainnya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Star selector */}
            <div className="space-y-1.5 text-center py-2">
              <p className="text-xs font-medium text-neutral-700 mb-1">
                Penilaian Kepuasan Produk
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    title={`${star} Bintang`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">
                {rating === 5
                  ? "Sangat Puas (Kopi Istimewa!)"
                  : rating === 4
                    ? "Puas (Kualitas Bagus)"
                    : rating === 3
                      ? "Cukup (Sesuai Ekspektasi)"
                      : rating === 2
                        ? "Kurang Puas"
                        : "Kecewa"}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Catatan Rasa & Ulasan (Opsional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contoh: Sangat wangi aroma melati, acidity cerah seperti jeruk nipis, sangrai medium sangat pas untuk pour over."
                rows={3}
                className="w-full text-xs rounded-sm border border-neutral-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Foto Kopi / Unboxing */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-700 flex items-center justify-between">
                <span>Foto Produk / Seduhan (Opsional)</span>
                {isUploading && (
                  <span className="text-[11px] text-primary-700 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                  </span>
                )}
              </label>

              {imageUrl ? (
                <div className="relative w-20 h-20 border rounded overflow-hidden group bg-neutral-100">
                  <Image
                    src={imageUrl}
                    alt="Foto ulasan"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                    title="Hapus foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="review-file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="review-file-upload"
                    className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-neutral-300 rounded text-xs text-neutral-600 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-neutral-500" />
                    <span>Tambahkan foto kemasan atau hasil seduhan</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending || isUploading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mengirim...
                  </>
                ) : (
                  "Kirim Ulasan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
