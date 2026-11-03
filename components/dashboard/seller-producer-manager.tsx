"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTableContainer } from "@/components/dashboard/data-table-container";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sprout,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  AlertCircle,
  FileText,
} from "lucide-react";
import { requestProducerAttributionAction } from "@/actions/producer.actions";
import { toast } from "sonner";
import type { Producer } from "@/types";
import type { ProducerAttribution } from "@/lib/data/producers";

interface SellerProducerManagerProps {
  attributions: ProducerAttribution[];
  producers: Producer[];
}

export function SellerProducerManager({
  attributions: initialAttributions,
  producers,
}: SellerProducerManagerProps) {
  const router = useRouter();
  const [attributions] = useState<ProducerAttribution[]>(initialAttributions);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedProducerId, setSelectedProducerId] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedProducerId) {
      setErrorMsg("Pilih produser atau petani yang ingin dihubungkan");
      return;
    }

    startTransition(async () => {
      const res = await requestProducerAttributionAction(
        selectedProducerId,
        evidenceUrl.trim() || undefined
      );

      if (res.success) {
        toast.success("Pengajuan atribusi produser berhasil dikirim.");
        setShowRequestDialog(false);
        setSelectedProducerId("");
        setEvidenceUrl("");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal mengajukan atribusi produser");
      }
    });
  };

  const approvedCount = attributions.filter((a) => a.status === "approved").length;
  const pendingCount = attributions.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 font-display">
            Hubungan Produser & Petani Kopi
          </h2>
          <p className="text-xs text-neutral-600">
            Hubungkan toko Anda dengan petani atau koperasi kopi terverifikasi agar dapat ditautkan ke produk kopi Anda.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowRequestDialog(true)}
          className="text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Ajukan Hubungan Produser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border-emerald-300 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800">Produser Disetujui</p>
              <p className="text-xl font-bold font-mono text-emerald-950 mt-0.5">
                {approvedCount}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">Dapat digunakan di form produk</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-amber-300 bg-amber-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800">Menunggu Verifikasi</p>
              <p className="text-xl font-bold font-mono text-amber-950 mt-0.5">
                {pendingCount}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Sedang ditinjau oleh kurator platform</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-neutral-300 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-neutral-600">Total Produser Terdaftar</p>
              <p className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                {producers.length}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">Petani, koperasi & processor</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attributions Table */}
      <DataTableContainer
        header={
          <div>
            <h3 className="font-heading text-base leading-snug font-medium text-neutral-900">
              Daftar Hubungan Produser Toko Anda
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Hanya produser dengan status &quot;Disetujui&quot; yang dapat dipilih pada formulir pembuatan produk kopi Anda.
            </p>
          </div>
        }
      >
        {attributions.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-600 space-y-2">
            <Sprout className="w-8 h-8 text-neutral-300 mx-auto" />
            <p>Belum ada hubungan produser yang diajukan.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRequestDialog(true)}
              className="text-xs mt-2"
            >
              Ajukan Produser Sekarang
            </Button>
          </div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nama Produser</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Bukti Kerjasama</TableHead>
                  <TableHead className="text-xs">Tanggal Pengajuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributions.map((a) => {
                  const prod = producers.find((p) => p.id === a.producerId);
                  const name = a.producerName || prod?.name || a.producerId;

                  return (
                    <TableRow key={`${a.producerId}-${a.sellerId}`}>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-neutral-900">{name}</p>
                        {prod && (
                          <p className="text-neutral-600 capitalize">
                            {prod.kind} • {prod.province || "Indonesia"}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.status === "approved" && (
                          <Badge variant="default" className="text-xs bg-emerald-600 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </Badge>
                        )}
                        {a.status === "pending" && (
                          <Badge variant="secondary" className="text-xs text-amber-800 bg-amber-100 gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Tinjauan
                          </Badge>
                        )}
                        {a.status === "rejected" && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.evidenceUrl ? (
                          <a
                            href={a.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900 underline font-medium"
                          >
                            <FileText className="w-3 h-3" /> Lihat Bukti
                          </a>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-600">
                        {new Date(a.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        )}
      </DataTableContainer>

      {/* Dialog Ajukan Produser */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-neutral-900">
              Ajukan Hubungan Produser Kopi
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-600">
              Pilih produser atau petani yang menjadi mitra pasokan ceri/green bean toko Anda dan lampirkan bukti valid.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequest} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Pilih Produser / Petani Mitra
              </label>
              <select
                value={selectedProducerId}
                onChange={(e) => setSelectedProducerId(e.target.value)}
                className="w-full text-xs rounded-md border border-neutral-300 p-2 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">-- Pilih Produser --</option>
                {producers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.kind} - {p.province || "Indonesia"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 block mb-1">
                Tautan Bukti Hubungan / Kerjasama (URL)
              </label>
              <Input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://example.com/invoice-atau-surat-tani.pdf"
              />
              <p className="text-xs text-neutral-600 mt-1">
                Bisa berupa faktur pembelian green bean, kwitansi, atau surat perjanjian jual beli ceri kopi.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRequestDialog(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
