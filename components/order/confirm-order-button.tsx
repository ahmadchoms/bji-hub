"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeOrderAction } from "@/actions/order.actions";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ConfirmOrderButtonProps {
  orderId: string;
  orderNumber?: string;
  className?: string;
  variant?: "default" | "outline";
  onConfirmed?: () => void;
}

export function ConfirmOrderButton({
  orderId,
  orderNumber,
  className,
  onConfirmed,
}: ConfirmOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    startTransition(async () => {
      const res = await completeOrderAction(orderId);
      if (res.success) {
        toast.success(
          `Pesanan ${orderNumber || ""} berhasil diselesaikan. Dana diteruskan ke penjual. Terima kasih!`,
        );
        setIsConfirming(false);
        router.refresh();
        onConfirmed?.();
      } else {
        toast.error(res.error || "Gagal mengonfirmasi pesanan diterima");
        setIsConfirming(false);
      }
    });
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={handleConfirm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Menyelesaikan...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Ya, Selesaikan Pesanan
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setIsConfirming(false)}
          className="text-xs h-8 px-2 text-neutral-600"
        >
          Batal
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={handleConfirm}
      className={`bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3 gap-1.5 ${
        className || ""
      }`}
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      Konfirmasi Pesanan Diterima
    </Button>
  );
}
