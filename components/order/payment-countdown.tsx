"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";

interface PaymentCountdownProps {
  createdAt: string; // ISO string
  durationMinutes?: number;
  className?: string;
}

export function PaymentCountdown({
  createdAt,
  durationMinutes = 60,
  className = "",
}: PaymentCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const createdTime = new Date(createdAt).getTime();
    const expiresAt = createdTime + durationMinutes * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, durationMinutes]);

  if (secondsRemaining === null) {
    return (
      <div className={`p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs text-center font-medium ${className}`}>
        ⏰ Menghitung batas waktu pembayaran...
      </div>
    );
  }

  const isExpired = secondsRemaining <= 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (isExpired) {
    return (
      <div className={`p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-900 text-xs text-center font-medium flex items-center justify-center gap-1.5 ${className}`}>
        <AlertCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
        <span>Batas waktu pembayaran telah habis. Pesanan ini akan otomatis dibatalkan.</span>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs text-center font-medium flex flex-col sm:flex-row items-center justify-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-amber-700 animate-pulse" aria-hidden="true" />
        <span>Selesaikan pembayaran dalam:</span>
      </div>
      <span className="font-mono text-sm font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
        {formattedTime}
      </span>
      <span className="text-amber-800 text-xs">
        (sebelum otomatis dibatalkan)
      </span>
    </div>
  );
}
