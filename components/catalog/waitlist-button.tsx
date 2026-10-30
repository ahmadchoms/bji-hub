"use client";

import { useState, useTransition } from "react";
import { Bell, Check, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinWaitlistAction, leaveWaitlistAction } from "@/actions/waitlist.actions";

interface WaitlistButtonProps {
  listingId: string;
  nextRoastDate?: string | null;
  initialInWaitlist?: boolean;
  className?: string;
}

export function WaitlistButton({
  listingId,
  nextRoastDate,
  initialInWaitlist = false,
  className = "",
}: WaitlistButtonProps) {
  const [inWaitlist, setInWaitlist] = useState(initialInWaitlist);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    setMessage(null);
    startTransition(async () => {
      if (inWaitlist) {
        const res = await leaveWaitlistAction(listingId);
        if (res.success) {
          setInWaitlist(false);
          setMessage("Antrean dibatalkan.");
        }
      } else {
        const res = await joinWaitlistAction(listingId);
        if (res.success) {
          setInWaitlist(true);
          setMessage("Kamu akan diberi tahu via notifikasi & email saat batch baru siap!");
        } else {
          setMessage(res.error || "Gagal mendaftar antrean.");
        }
      }
    });
  };

  return (
    <div className={`space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 ${className}`}>
      {nextRoastDate && (
        <div className="flex items-center gap-2 text-xs font-medium text-amber-900 border-b border-amber-200/80 pb-2.5">
          <Calendar className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
          <span>
            Jadwal Sangrai Berikutnya:{" "}
            <strong>
              {new Date(nextRoastDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
          </span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-neutral-700 leading-relaxed">
          Stok saat ini sedang habis. Daftarkan diri ke daftar tunggu untuk langsung mendapatkan kabar begitu batch sangrai berikutnya matang.
        </p>

        <Button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          variant={inWaitlist ? "secondary" : "default"}
          className="w-full text-xs font-semibold gap-2 coarse:min-h-11"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : inWaitlist ? (
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Bell className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {inWaitlist
              ? "Terdaftar di Antrean • Klik untuk Batal"
              : "Ingatkan Saya Saat Stok Tersedia"}
          </span>
        </Button>

        {message && (
          <p
            className={`text-xs ${
              inWaitlist ? "text-emerald-800" : "text-neutral-700"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
