"use client";

import { ListingWithRelations, Payment, Subscription } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { isActiveBoost } from "@/lib/boost";
import { BOOST_OPTIONS, boostOptionLabel } from "@/lib/plans";
import { useRouter } from "next/navigation";
import { purchaseBoostAction } from "@/actions/seller.actions";
import { BoostCredits } from "@/lib/boost-credits";
import { formatWib } from "@/lib/format-date";

interface BillingSectionProps {
  subscription?: Subscription;
  payments: Payment[];
  listings: ListingWithRelations[];
  credits: BoostCredits;
  className?: string;
}

const BOOST_DURATIONS = BOOST_OPTIONS.map((o) => ({
  value: o.value,
  label: boostOptionLabel(o),
  price: o.price,
}));

const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "outline" | "destructive" }
> = {
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
  payments,
  listings,
  credits,
  className,
}: BillingSectionProps) {
  const router = useRouter();
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [boostLoading, setBoostLoading] = useState(false);
  const [payWith, setPayWith] = useState<"credit" | "cash">("credit");

  const hasCredit = credits.remaining > 0;
  const useCredit = hasCredit && payWith === "credit";
  const duration = useCredit ? String(credits.days) : selectedDuration;
  const activeBoosts = listings.filter(isActiveBoost).length;
  const resetDate = formatWib(credits.resetsAt, "dayMonth");

  const handleBoost = async () => {
    if (!selectedListing || !duration) return;
    setBoostLoading(true);
    try {
      const result = await purchaseBoostAction({
        listingId: selectedListing,
        duration,
        useCredit,
      });
      if (!result.success) {
        toast.error("Boost gagal diproses", { description: result.error });
        return;
      }
      if (result.data.status === "paid") {
        toast.success("Boost berhasil diaktifkan", {
          description:
            "Listing Anda akan tampil di slot iklan pada pencarian yang cocok.",
        });
      } else {
        toast.info("Menunggu pembayaran", {
          description: "Boost aktif setelah pembayaran dikonfirmasi.",
        });
      }
      setBoostDialogOpen(false);
      setSelectedListing("");
      setSelectedDuration("");
      router.refresh();
    } catch {
      toast.error("Boost gagal diproses", {
        description: "Terjadi kesalahan. Coba lagi.",
      });
    } finally {
      setBoostLoading(false);
    }
  };

  return (
    <div className={cn("space-y-10", className)}>
      {/* Boost */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
          <div>
            <h3 className="font-display text-lg text-neutral-900 font-semibold">
              Boost Listing
            </h3>
            {credits.total > 0 && (
              <p className="mt-0.5 text-xs text-neutral-600">
                Kredit boost gratis bulan ini:{" "}
                <span className="font-mono tabular-nums">
                  {credits.remaining} dari {credits.total}
                </span>
                {credits.remaining === 0 && `, kembali ${resetDate}`}
              </p>
            )}
          </div>
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
                  Tampilkan produk Anda sebagai iklan di hasil pencarian yang
                  cocok.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField label="Pilih Listing" required>
                  <Select
                    value={selectedListing}
                    onValueChange={(val) => setSelectedListing(val ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih listing untuk boost" />
                    </SelectTrigger>
                    <SelectContent>
                      {listings
                        .filter(
                          (l) => l.status === "active" && !isActiveBoost(l),
                        )
                        .map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                {hasCredit && (
                  <fieldset className="space-y-2">
                    <legend className="sr-only">Cara pembayaran</legend>
                    {(
                      [
                        [
                          "credit",
                          `Pakai kredit gratis (sisa ${credits.remaining}, ${credits.days} hari)`,
                        ],
                        ["cash", "Bayar"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex min-h-11 cursor-pointer items-center gap-3 border border-neutral-300 px-3 text-sm has-checked:border-primary-600"
                      >
                        <input
                          type="radio"
                          name="boost-pay"
                          checked={payWith === value}
                          onChange={() => setPayWith(value)}
                          className="accent-primary-600"
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                )}
                {!useCredit && (
                  <FormField label="Durasi Boost" required>
                    <Select
                      value={selectedDuration}
                      onValueChange={(val) => setSelectedDuration(val ?? "")}
                    >
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
                )}
                {activeBoosts > 0 && (
                  <p className="text-xs text-neutral-600">
                    Anda punya {activeBoosts} boost aktif. Di satu halaman hanya
                    satu listing Anda yang tampil sebagai iklan, jadi boost
                    tambahan bergantian dengan yang lain dan paling berguna saat
                    pembeli memfilter kategori atau asal yang berbeda.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="primary"
                  onClick={handleBoost}
                  disabled={!selectedListing || !duration || boostLoading}
                >
                  {boostLoading
                    ? "Memproses..."
                    : useCredit
                      ? "Aktifkan dengan Kredit"
                      : "Bayar & Aktifkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-neutral-300">
          <h3 className="font-display text-lg text-neutral-900 font-semibold">
            Riwayat Pembayaran
          </h3>
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
                    const statusConf =
                      PAYMENT_STATUS_MAP[pay.status] ??
                      PAYMENT_STATUS_MAP.pending;
                    return (
                      <TableRow key={pay.id}>
                        <TableCell className="font-mono text-xs text-neutral-700">
                          {pay.midtransOrderId}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_TYPE_MAP[pay.type] ?? pay.type}
                        </TableCell>
                        <TableCell className="font-mono tabular-nums font-medium text-primary-900">
                          {formatRupiah(pay.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConf.variant}
                            className="text-xs"
                          >
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-500 font-mono text-xs">
                          {pay.paidAt
                            ? format(new Date(pay.paidAt), "d MMM yyyy", {
                                locale: idLocale,
                              })
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
                const statusConf =
                  PAYMENT_STATUS_MAP[pay.status] ?? PAYMENT_STATUS_MAP.pending;
                return (
                  <div key={pay.id} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {PAYMENT_TYPE_MAP[pay.type] ?? pay.type}
                      </span>
                      <Badge variant={statusConf.variant} className="text-xs">
                        {statusConf.label}
                      </Badge>
                    </div>
                    <p className="font-mono tabular-nums font-medium text-primary-900 text-sm">
                      {formatRupiah(pay.amount)}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      {pay.paidAt
                        ? format(new Date(pay.paidAt), "d MMM yyyy HH:mm", {
                            locale: idLocale,
                          })
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
