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
import { disputeOrderAction } from "@/actions/order.actions";
import { uploadImage } from "@/lib/upload-client";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Camera, X } from "lucide-react";

interface OrderDisputeModalProps {
  orderId: string;
  orderNumber: string;
}

export function OrderDisputeModal({ orderId, orderNumber }: OrderDisputeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadImage(file);
      setEvidenceUrl(res.url);
      toast.success("Foto bukti kendala berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto bukti");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error("Mohon jelaskan kendala pesanan minimal 5 karakter");
      return;
    }

    startTransition(async () => {
      const res = await disputeOrderAction({ orderId, reason, evidenceUrl });
      if (res.success) {
        toast.success(
          "Komplain berhasil diajukan. Status pesanan diubah ke Komplain. Pembayaran ditangguhkan dan tim kami akan segera menindaklanjuti.",
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengajukan komplain");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 gap-1"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        Ada Masalah Pesanan?
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Ajukan Komplain Pesanan ({orderNumber})
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Pengajuan ini akan menahan penerusan dana ke penjual sampai kendala diselesaikan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Alasan / Kendala Pesanan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Kemasan kopi sobek dan basah saat diterima, atau varian rasa tidak sesuai dengan yang dipesan."
                rows={3}
                className="w-full text-xs rounded-sm border border-neutral-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            {/* Upload Foto Bukti Kerusakan / Masalah */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-700 flex items-center justify-between">
                <span>Foto Bukti Fisik / Kerusakan (Opsional)</span>
                {isUploading && (
                  <span className="text-[11px] text-primary-700 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah...
                  </span>
                )}
              </label>

              {evidenceUrl ? (
                <div className="relative w-24 h-24 border rounded overflow-hidden group bg-neutral-100">
                  <Image
                    src={evidenceUrl}
                    alt="Bukti komplain"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
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
                    id="dispute-file-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="dispute-file-upload"
                    className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-300 rounded text-xs text-neutral-600 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-neutral-500" />
                    <span>Unggah foto kondisi paket / barang</span>
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
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Mengajukan...
                  </>
                ) : (
                  "Kirim Komplain Pesanan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
