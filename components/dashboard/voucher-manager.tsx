"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createVoucherAction, toggleVoucherActiveAction } from "@/actions/voucher.actions";
import type { VoucherData } from "@/lib/data/vouchers";
import { Tag, Plus, CheckCircle2, AlertCircle, Calendar, Hash } from "lucide-react";

interface VoucherManagerProps {
  initialVouchers: VoucherData[];
  isAdmin?: boolean;
  sellerId?: string | null;
}

export function VoucherManager({ initialVouchers, isAdmin = false, sellerId }: VoucherManagerProps) {
  const [vouchers, setVouchers] = useState<VoucherData[]>(initialVouchers);
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed" | "free_shipping">("percent");
  const [value, setValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(50000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(20000);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [endsAt, setEndsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const handleToggleActive = (id: string, currentActive: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await toggleVoucherActiveAction(id, !currentActive);
      if (res.success) {
        setVouchers((prev) =>
          prev.map((v) => (v.id === id ? { ...v, active: !currentActive } : v))
        );
        setSuccessMsg(`Status voucher berhasil diubah menjadi ${!currentActive ? "Aktif" : "Nonaktif"}`);
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minSubtotal: Number(minSubtotal),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: 1,
        sellerId: isAdmin ? null : (sellerId || null),
      };

      const res = await createVoucherAction(payload);
      if (res.success) {
        setVouchers((prev) => [res.data as VoucherData, ...prev]);
        setSuccessMsg(`Voucher ${res.data.code} berhasil dibuat!`);
        setShowCreateForm(false);
        setCode("");
      } else {
        setErrorMsg(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
            {isAdmin ? "Kelola Voucher Platform & Toko" : "Voucher Promo Toko"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Kelola kupon diskon platform dan pantau kupon yang dibuat oleh seluruh penjual."
              : "Buat kode promo diskon untuk meningkatkan transaksi dan loyalitas pelanggan toko Anda."}
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs gap-1.5 self-start sm:self-auto"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="h-3.5 w-3.5" />
          {showCreateForm ? "Tutup Form" : "Buat Voucher Baru"}
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {showCreateForm && (
        <Card className="border-amber-200 dark:border-amber-900/40 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" /> Form Tambah Voucher
            </CardTitle>
            <CardDescription className="text-xs">
              Isi parameter diskon dan batas masa berlaku kode promo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-semibold">Kode Voucher</Label>
                  <Input
                    id="code"
                    placeholder="CONTOH: KOPIHEMAT10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono text-xs uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-semibold">Tipe Diskon</Label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as "percent" | "fixed" | "free_shipping")}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                    <option value="free_shipping">Gratis Ongkir</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="value" className="text-xs font-semibold">
                    {type === "percent" ? "Besar Diskon (%)" : "Nominal Potongan (Rp)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    max={type === "percent" ? 100 : 10000000}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="minSubtotal" className="text-xs font-semibold">Min. Belanja (Rp)</Label>
                  <Input
                    id="minSubtotal"
                    type="number"
                    min="0"
                    step="5000"
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(Number(e.target.value))}
                    className="text-xs"
                    required
                  />
                </div>

                {type === "percent" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDiscount" className="text-xs font-semibold">Maks. Potongan (Rp)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      step="5000"
                      placeholder="Opsional (tanpa batas)"
                      value={maxDiscount ?? ""}
                      onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="usageLimit" className="text-xs font-semibold">Batas Kuota Pemakaian</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={usageLimit ?? ""}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startsAt" className="text-xs font-semibold">Tanggal Mulai</Label>
                  <Input
                    id="startsAt"
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endsAt" className="text-xs font-semibold">Tanggal Berakhir</Label>
                  <Input
                    id="endsAt"
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowCreateForm(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="text-xs" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan & Terbitkan Voucher"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Voucher Table / List */}
      <Card className="border-neutral-200 dark:border-neutral-800 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="p-3 font-semibold">Kode Voucher</th>
                <th className="p-3 font-semibold">Tipe & Nilai</th>
                <th className="p-3 font-semibold">Min. Belanja</th>
                <th className="p-3 font-semibold">Pemakaian</th>
                <th className="p-3 font-semibold">Masa Berlaku</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground text-xs">
                    Belum ada voucher yang dibuat. Klik tombol &quot;Buat Voucher Baru&quot; di atas untuk memulai promo.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>{v.code}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {v.type === "percent" && `${v.value}% (Maks Rp ${Number(v.maxDiscount || 0).toLocaleString("id-ID")})`}
                      {v.type === "fixed" && `Rp ${Number(v.value).toLocaleString("id-ID")}`}
                      {v.type === "free_shipping" && "Gratis Ongkir"}
                    </td>
                    <td className="p-3">
                      Rp {Number(v.minSubtotal).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        {v.usedCount} / {v.usageLimit || "∞"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(v.startsAt).toLocaleDateString("id-ID")} - {new Date(v.endsAt).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="p-3">
                      {v.active ? (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900">
                          Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant={v.active ? "outline" : "default"}
                        className="text-xs h-7 px-2.5"
                        disabled={isPending}
                        onClick={() => handleToggleActive(v.id, v.active)}
                      >
                        {v.active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
