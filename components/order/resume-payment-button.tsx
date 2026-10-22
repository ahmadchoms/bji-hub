"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  resumeOrderPaymentAction,
  checkOrderPaymentStatusAction,
} from "@/actions/order.actions";
import { toast } from "sonner";
import { CreditCard, RefreshCw, Loader2 } from "lucide-react";

interface ResumePaymentButtonProps {
  orderId: string;
  orderNumber: string;
  accessToken?: string;
  className?: string;
}

export function ResumePaymentButton({
  orderId,
  orderNumber: _orderNumber,
  accessToken,
  className,
}: ResumePaymentButtonProps) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [isChecking, startCheckingTransition] = useTransition();

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const res = await resumeOrderPaymentAction(orderId, accessToken);
      if (!res.success) {
        toast.error(res.error || "Gagal memproses pembayaran");
        return;
      }

      const { snapToken } = res.data;
      if (
        snapToken &&
        typeof window !== "undefined" &&
        (
          window as unknown as {
            snap?: { pay: (token: string, options: unknown) => void };
          }
        ).snap
      ) {
        const snap = (
          window as unknown as {
            snap: { pay: (token: string, options: unknown) => void };
          }
        ).snap;
        snap.pay(snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil!");
            router.refresh();
          },
          onPending: () => {
            toast.info("Menunggu pembayaran diselesaikan.");
            router.refresh();
          },
          onError: () => {
            toast.error("Pembayaran dibatalkan atau gagal.");
          },
          onClose: () => {
            toast.info("Jendela pembayaran ditutup.");
          },
        });
      } else {
        toast.info("Popup Snap tidak tersedia atau mode simulasi aktif.");
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleCheckStatus = () => {
    startCheckingTransition(async () => {
      const res = await checkOrderPaymentStatusAction(orderId, accessToken);
      if (res.success && res.data?.isPaid) {
        toast.success("Pembayaran telah terverifikasi!");
        router.refresh();
      } else {
        toast.info(
          "Status pembayaran masih belum terverifikasi di Midtrans. Silakan selesaikan pembayaran terlebih dahulu.",
        );
      }
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      <Button
        onClick={handlePay}
        disabled={isPaying || isChecking}
        className="bg-primary hover:bg-primary-800 text-white font-medium text-xs h-9 px-4 shadow-xs gap-1.5"
      >
        {isPaying ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CreditCard className="w-3.5 h-3.5" />
        )}
        <span>{isPaying ? "Menyiapkan..." : "Bayar Sekarang"}</span>
      </Button>

      <Button
        variant="outline"
        onClick={handleCheckStatus}
        disabled={isChecking || isPaying}
        className="text-xs h-9 px-3 gap-1.5 border-neutral-300 hover:bg-neutral-100"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
        <span>{isChecking ? "Memeriksa..." : "Cek Status"}</span>
      </Button>
    </div>
  );
}
