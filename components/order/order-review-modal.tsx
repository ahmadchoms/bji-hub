"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { submitReviewAction } from "@/actions/order.actions";
import { toast } from "sonner";
import { Star, Loader2, MessageSquare } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await submitReviewAction({
        orderId,
        listingId,
        rating,
        comment,
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

            <div className="flex items-center justify-end gap-2 pt-1">
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
                disabled={isPending}
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
