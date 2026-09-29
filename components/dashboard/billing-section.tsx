"use client";

import { Payment, Subscription } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ListingWithRelations } from "@/types";
import { toast } from "sonner";

interface BillingSectionProps {
  subscription?: Subscription;
  payments: Payment[];
  listings: ListingWithRelations[];
  className?: string;
}

const TIER_ROWS = [
  { tier: "free", name: "Gratis", price: "Rp 0", listings: "Maks. 3", verified: "—", analytics: "—", boost: "—", priority: "—" },
  { tier: "growth", name: "Growth", price: "Rp 79.000", listings: "Maks. 15", verified: "Badge", analytics: "Dasar", boost: "—", priority: "Tinggi" },
  { tier: "business", name: "Business", price: "Rp 149.000", listings: "Unlimited", verified: "Badge", analytics: "Lengkap", boost: "2/bulan", priority: "Tertinggi" },
];

const BOOST_DURATIONS = [
  { value: "7", label: "7 hari — Rp25.000", price: 25000 },
  { value: "14", label: "14 hari — Rp45.000", price: 45000 },
  { value: "30", label: "30 hari — Rp75.000", price: 75000 },
];

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: "default" | "outline" | "destructive" }> = {
  paid: { label: "Lunas", variant: "default" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
};

const PAYMENT_TYPE_MAP: Record<string, string> = {
  subscription: "Langganan",
  boost: "Boost",
  verification: "Verifikasi",
};

export function BillingSection({
  subscription,
  payments,
  listings,
  className,
}: BillingSectionProps) {
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [boostLoading, setBoostLoading] = useState(false);

  const handleBoost = async () => {
    if (!selectedListing || !selectedDuration) return;
    setBoostLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Boost berhasil diaktifkan!", {
      description: "Listing Anda akan tampil di posisi teratas.",
    });
    setBoostLoading(false);
    setBoostDialogOpen(false);
    setSelectedListing("");
    setSelectedDuration("");
  };

  return (
    <div className={cn("space-y-10", className)}>
      {/* Pricing Ledger Table */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">Skema Langganan</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Analitik</TableHead>
                <TableHead>Boost</TableHead>
                <TableHead>Prioritas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIER_ROWS.map((row) => {
                const isCurrent = subscription?.tier === row.tier;
                return (
                  <TableRow key={row.tier} className={isCurrent ? "bg-primary-50" : ""}>
                    <TableCell className="font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        {row.name}
                        {isCurrent && <Badge variant="default" className="text-[10px]">Aktif</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums font-medium text-primary-900">{row.price}<span className="text-neutral-500 font-sans">/bln</span></TableCell>
                    <TableCell>{row.listings}</TableCell>
                    <TableCell>{row.verified}</TableCell>
                    <TableCell>{row.analytics}</TableCell>
                    <TableCell>{row.boost}</TableCell>
                    <TableCell>{row.priority}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Boost */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">Boost Listing</h3>
          <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="primary" className="gap-2">
                  <span className="text-xs">Boost Listing</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Boost Listing</DialogTitle>
                <DialogDescription>
                  Tampilkan produk Anda di posisi teratas katalog untuk meningkatkan visibilitas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField label="Pilih Listing" required>
                  <Select value={selectedListing} onValueChange={(val) => setSelectedListing(val ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih listing untuk boost" />
                    </SelectTrigger>
                    <SelectContent>
                      {listings
                        .filter((l) => l.status === "active" && !l.isBoosted)
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Durasi Boost" required>
                  <Select value={selectedDuration} onValueChange={(val) => setSelectedDuration(val ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih durasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOST_DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <DialogFooter>
                <Button
                  variant="primary"
                  onClick={handleBoost}
                  disabled={!selectedListing || !selectedDuration || boostLoading}
                >
                  {boostLoading ? "Memproses..." : "Bayar & Aktifkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">Riwayat Pembayaran</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Belum Ada Transaksi"
              description="Riwayat pembayaran langganan dan boost akan muncul di sini."
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pay) => {
                    const statusConf = PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                    return (
                      <TableRow key={pay.id}>
                        <TableCell className="font-mono text-xs text-neutral-700">
                          {pay.midtransOrderId}
                        </TableCell>
                        <TableCell>{PAYMENT_TYPE_MAP[pay.type] ?? pay.type}</TableCell>
                        <TableCell className="font-mono tabular-nums font-medium text-primary-900">
                          {formatRupiah(pay.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                        </TableCell>
                        <TableCell className="text-neutral-500 font-mono text-xs">
                          {pay.paidAt
                            ? format(new Date(pay.paidAt), "d MMM yyyy", { locale: idLocale })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden divide-y divide-neutral-200 border border-neutral-300 rounded-sm">
              {payments.map((pay) => {
                const statusConf = PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                return (
                  <div key={pay.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{PAYMENT_TYPE_MAP[pay.type] ?? pay.type}</span>
                      <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                    </div>
                    <p className="font-mono tabular-nums font-medium text-primary-900 text-sm">
                      {formatRupiah(pay.amount)}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {pay.paidAt
                        ? format(new Date(pay.paidAt), "d MMM yyyy HH:mm", { locale: idLocale })
                        : pay.midtransOrderId}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}