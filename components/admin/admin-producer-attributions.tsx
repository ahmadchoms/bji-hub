"use client";

import { useState, useTransition } from "react";
import type { ProducerAttribution } from "@/lib/data/producers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveProducerAttributionAction,
  rejectProducerAttributionAction,
} from "@/actions/producer.actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

interface AdminProducerAttributionsProps {
  attributions: ProducerAttribution[];
}

export function AdminProducerAttributions({
  attributions: initialAttributions,
}: AdminProducerAttributionsProps) {
  const [attributions, setAttributions] = useState<ProducerAttribution[]>(initialAttributions);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (producerId: string, sellerId: string) => {
    startTransition(async () => {
      const res = await approveProducerAttributionAction(producerId, sellerId);
      if (res.success) {
        setAttributions((prev) =>
          prev.map((item) =>
            item.producerId === producerId && item.sellerId === sellerId
              ? { ...item, status: "approved", approvedAt: new Date().toISOString() }
              : item
          )
        );
        toast.success("Atribusi produser berhasil disetujui.");
      } else {
        toast.error(res.error || "Gagal menyetujui atribusi produser.");
      }
    });
  };

  const handleReject = (producerId: string, sellerId: string) => {
    startTransition(async () => {
      const res = await rejectProducerAttributionAction(producerId, sellerId);
      if (res.success) {
        setAttributions((prev) =>
          prev.map((item) =>
            item.producerId === producerId && item.sellerId === sellerId
              ? { ...item, status: "rejected" }
              : item
          )
        );
        toast.success("Pengajuan atribusi produser ditolak.");
      } else {
        toast.error(res.error || "Gagal menolak atribusi produser.");
      }
    });
  };

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Pengajuan Atribusi Produser & Penjual
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Verifikasi hubungan langsung penjual dengan produser/petani sebelum listing dapat diterbitkan.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {attributions.length} Pengajuan
        </Badge>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produser</TableHead>
              <TableHead>Penjual / Toko</TableHead>
              <TableHead>Bukti</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-neutral-600">
                  Belum ada pengajuan atribusi produser.
                </TableCell>
              </TableRow>
            ) : (
              attributions.map((item) => (
                <TableRow key={`${item.producerId}-${item.sellerId}`}>
                  <TableCell className="font-medium text-neutral-900">
                    {item.producerName || item.producerId}
                  </TableCell>
                  <TableCell className="text-neutral-700">
                    {item.sellerStoreName || item.sellerId}
                  </TableCell>
                  <TableCell>
                    {item.evidenceUrl ? (
                      <a
                        href={item.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-700 underline coarse:min-h-11"
                      >
                        Dokumen <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-600">Tidak ada bukti</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.status === "approved" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        Disetujui
                      </Badge>
                    ) : item.status === "rejected" ? (
                      <Badge className="bg-red-100 text-red-800 border-red-300">
                        Ditolak
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        Menunggu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-600">
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleApprove(item.producerId, item.sellerId)}
                          className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 coarse:min-h-11"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleReject(item.producerId, item.sellerId)}
                          className="h-8 text-xs text-red-700 border-red-300 hover:bg-red-50 coarse:min-h-11"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-600 font-mono">Selesai</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
