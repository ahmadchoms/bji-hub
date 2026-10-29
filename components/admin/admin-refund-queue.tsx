"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { retryRefundAction, resolveManualRefundAction } from "@/actions/refund.actions";
import { toast } from "sonner";
import type { RefundRecord } from "@/lib/data/refunds";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

interface AdminRefundQueueProps {
  refunds: RefundRecord[];
}

export function AdminRefundQueue({ refunds }: AdminRefundQueueProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [manualDialogRefundId, setManualDialogRefundId] = useState<string | null>(null);
  const [manualNote, setManualNote] = useState<string>("");

  const filteredRefunds = refunds.filter((r) => {
    if (filter === "all") return true;
    if (filter === "attention") return r.status === "manual_required" || r.status === "failed";
    return r.status === filter;
  });

  const handleRetry = (refundId: string) => {
    startTransition(async () => {
      const res = await retryRefundAction(refundId);
      if (res.success) {
        toast.success(
          res.data.status === "processed"
            ? "Pengembalian dana berhasil diproses oleh gateway pembayaran!"
            : `Status pengembalian dana: ${res.data.status}`,
        );
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mencoba ulang pengembalian dana");
      }
    });
  };

  const handleManualResolve = (refundId: string) => {
    startTransition(async () => {
      const res = await resolveManualRefundAction(refundId, manualNote);
      if (res.success) {
        toast.success("Pengembalian dana berhasil ditandai selesai ditransfer manual!");
        setManualDialogRefundId(null);
        setManualNote("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui status refund manual");
      }
    });
  };

  const attentionCount = refunds.filter(
    (r) => r.status === "manual_required" || r.status === "failed",
  ).length;
  const processedCount = refunds.filter((r) => r.status === "processed").length;
  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 text-xs">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
            filter === "all"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Semua ({refunds.length})
        </button>
        <button
          onClick={() => setFilter("attention")}
          className={`px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition-colors ${
            filter === "attention"
              ? "bg-amber-600 text-white"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Perlu Tindakan ({attentionCount})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
            filter === "pending"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Menunggu ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("processed")}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
            filter === "processed"
              ? "bg-emerald-700 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Selesai ({processedCount})
        </button>
      </div>

      {filteredRefunds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-neutral-200 p-8">
          <RotateCcw className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800">
            Tidak ada pengembalian dana
          </h3>
          <p className="text-xs text-neutral-600 mt-1">
            Belum ada antrean refund pada kategori ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRefunds.map((ref) => {
            const isManualRequired = ref.status === "manual_required";
            const isFailed = ref.status === "failed";
            const isPendingStatus = ref.status === "pending";
            const isProcessed = ref.status === "processed";

            return (
              <div
                key={ref.id}
                className={`bg-white rounded-lg border p-4 sm:p-5 transition-shadow hover:shadow-xs space-y-3 ${
                  isManualRequired
                    ? "border-amber-300 bg-amber-50/20"
                    : isFailed
                      ? "border-rose-200 bg-rose-50/10"
                      : "border-neutral-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-600">
                        Refund #{ref.id}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="font-mono text-xs font-semibold text-neutral-800">
                        Order #{ref.orderId}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-neutral-900 mt-1 font-mono">
                      {formatRupiah(ref.amount)}
                    </div>
                  </div>

                  <div>
                    {isManualRequired ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Perlu Transfer Manual
                      </Badge>
                    ) : isFailed ? (
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300">
                        Gagal Gateway ({ref.attempts}x)
                      </Badge>
                    ) : isPendingStatus ? (
                      <Badge className="bg-neutral-100 text-neutral-700 border-neutral-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Dalam Antrean ({ref.attempts}x)
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Selesai
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-md border border-neutral-200/60">
                  <div>
                    <span className="text-neutral-400 block text-xs">Alasan Pembatalan:</span>
                    <span className="font-medium text-neutral-800">{ref.reason}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-xs">Diajukan oleh:</span>
                    <span className="font-medium text-neutral-800">{ref.createdBy || "Sistem"}</span>
                  </div>
                  {ref.providerRef && (
                    <div>
                      <span className="text-neutral-400 block text-xs">ID Referensi Gateway:</span>
                      <span className="font-mono text-xs text-neutral-700">{ref.providerRef}</span>
                    </div>
                  )}
                  {ref.failureReason && (
                    <div className="sm:col-span-2 text-amber-800">
                      <span className="text-neutral-400 block text-xs">Catatan / Pesan Gateway:</span>
                      <span className="text-xs">{ref.failureReason}</span>
                    </div>
                  )}
                  {ref.resolvedBy && (
                    <div>
                      <span className="text-neutral-400 block text-xs">Diselesaikan oleh:</span>
                      <span className="font-medium text-neutral-800">{ref.resolvedBy}</span>
                    </div>
                  )}
                </div>

                {/* Actions for Pending / Failed / Manual Required */}
                {(!isProcessed || isFailed || isManualRequired) && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleRetry(ref.id)}
                      className="text-xs h-8"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Coba Ulang Otomatis
                    </Button>

                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => setManualDialogRefundId(ref.id)}
                      className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Tandai Sudah Transfer Manual
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Resolve Prompt Modal */}
      {manualDialogRefundId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">
              Konfirmasi Pengembalian Dana Manual
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Pastikan Anda telah mentransfer dana ke rekening pembeli sesuai nomor rekening yang valid. Masukkan nomor referensi transfer bank sebagai bukti.
            </p>
            <textarea
              className="w-full text-xs p-2.5 border border-neutral-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              rows={3}
              placeholder="Contoh: BCA Transfer Ref #88291039 an Budi Santoso"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setManualDialogRefundId(null);
                  setManualNote("");
                }}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleManualResolve(manualDialogRefundId)}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Konfirmasi Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
