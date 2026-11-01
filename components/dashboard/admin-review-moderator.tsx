"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, ShieldAlert, CheckCircle2, EyeOff, AlertCircle } from "lucide-react";
import { adminApproveReviewAction, adminHideReviewAction } from "@/actions/review.actions";
import type { Review } from "@/types";

interface AdminReviewModeratorProps {
  initialReviews: Review[];
}

export function AdminReviewModerator({ initialReviews }: AdminReviewModeratorProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleApprove = (id: string) => {
    setMsg(null);
    startTransition(async () => {
      const res = await adminApproveReviewAction(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setMsg({ text: "Ulasan berhasil disetujui dan laporan dibatalkan." });
      } else {
        setMsg({ text: res.error, isError: true });
      }
    });
  };

  const handleHide = (id: string) => {
    setMsg(null);
    startTransition(async () => {
      const res = await adminHideReviewAction(id);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, moderationStatus: "rejected" } : r))
        );
        setMsg({ text: "Ulasan disembunyikan dari publik." });
      } else {
        setMsg({ text: res.error, isError: true });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
          Moderasi & Antrean Ulasan Dilaporkan
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Tinjau ulasan yang dilaporkan oleh komunitas pengguna karena dugaan spam, bahasa tidak pantas, atau sengketa.
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
            msg.isError
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {msg.isError ? (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <Card className="border-neutral-200 dark:border-neutral-800 bg-card shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto opacity-80" />
            <p className="font-semibold text-foreground text-sm">Tidak ada ulasan yang perlu dimoderasi</p>
            <p>Semua ulasan produk dalam kondisi aman dan tidak ada laporan aktif.</p>
          </div>
        ) : (
          <div className="divide-y divide-border text-xs">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 sm:p-5 space-y-3 hover:bg-muted/10 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{r.buyerName}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating ? "fill-amber-400 text-amber-500" : "text-neutral-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>

                {r.comment && <p className="text-neutral-800 dark:text-neutral-200">{r.comment}</p>}

                {r.reportReason && (
                  <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Alasan Laporan:</span> {r.reportReason}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Badge variant="outline" className="text-xs">
                    Status: {r.moderationStatus || "pending"}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      disabled={isPending || r.moderationStatus === "rejected"}
                      onClick={() => handleHide(r.id)}
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      {r.moderationStatus === "rejected" ? "Disembunyikan" : "Sembunyikan Ulasan"}
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isPending}
                      onClick={() => handleApprove(r.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui & Hapus Laporan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
