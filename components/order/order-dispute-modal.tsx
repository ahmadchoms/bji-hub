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
import { disputeOrderAction } from "@/actions/order.actions";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OrderDisputeModalProps {
  orderId: string;
  orderNumber: string;
}

export function OrderDisputeModal({ orderId, orderNumber }: OrderDisputeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error("Mohon jelaskan kendala pesanan minimal 5 karakter");
      return;
    }

    startTransition(async () => {
      const res = await disputeOrderAction({ orderId, reason });
      if (res.success) {
        toast.success(
          "Komplain berhasil diajukan. Status pesanan diubah ke Komplain. Dana escrow ditahan dan tim kami akan segera menindaklanjuti.",
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
              Pengajuan ini akan menahan pencairan dana ke penjual di rekening escrow sampai kendala diselesaikan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Alasan / Kendala Pesanan
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
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Mengirimkan...
                  </>
                ) : (
                  "Kirim Pengajuan Komplain"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
