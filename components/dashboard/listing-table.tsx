"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListingWithRelations } from "@/types";
import { formatRupiah } from "@/components/shared/price-text";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { isActiveBoost } from "@/lib/boost";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Pencil, Eye, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  quickUpdateStockAction,
  toggleListingStatusAction,
  addRoastBatchAction,
} from "@/actions/seller.actions";
import { toast } from "sonner";

interface ListingTableProps {
  listings: ListingWithRelations[];
  className?: string;
}

function QuickStatusToggle({
  listingId,
  currentStatus,
  title,
}: {
  listingId: string;
  currentStatus: string;
  title: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  if (status === "suspended") {
    return (
      <Badge variant="destructive" className="text-xs">
        Ditangguhkan
      </Badge>
    );
  }

  const isCurrentActive = status === "active";

  const handleToggle = async () => {
    const nextStatus = isCurrentActive ? "archived" : "active";
    setLoading(true);
    const res = await toggleListingStatusAction(listingId, nextStatus);
    setLoading(false);
    if (res.success) {
      setStatus(nextStatus);
      toast.success(
        nextStatus === "active"
          ? `"${title}" diaktifkan di katalog`
          : `"${title}" dinonaktifkan (diarsipkan)`,
      );
    } else {
      toast.error(res.error || "Gagal mengubah status produk");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={
        isCurrentActive
          ? "Klik untuk menonaktifkan produk dari katalog"
          : "Klik untuk mengaktifkan produk ke katalog"
      }
      className="cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 inline-flex items-center"
    >
      <Badge
        variant={
          isCurrentActive
            ? "default"
            : status === "draft"
              ? "secondary"
              : "outline"
        }
        className={cn(
          "text-xs transition-colors",
          isCurrentActive
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "text-neutral-600 hover:bg-neutral-100",
        )}
      >
        {loading
          ? "..."
          : isCurrentActive
            ? "Aktif ●"
            : status === "draft"
              ? "Draf ✎"
              : "Nonaktif ○"}
      </Badge>
    </button>
  );
}

function QuickStockDialog({
  listingId,
  title,
  currentStock,
  unit,
}: {
  listingId: string;
  title: string;
  currentStock: number;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [stockVal, setStockVal] = useState(String(currentStock));
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(stockVal);
    if (isNaN(num) || num < 0) {
      toast.error("Masukkan kuantitas stok yang valid");
      return;
    }
    setLoading(true);
    const res = await quickUpdateStockAction(listingId, num);
    setLoading(false);
    if (res.success) {
      toast.success(`Stok "${title}" diperbarui: ${num} ${unit}`);
      setOpen(false);
    } else {
      toast.error(res.error || "Gagal memperbarui stok");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer hover:opacity-80 transition-opacity text-left inline-flex"
            title="Klik untuk ubah stok cepat"
          />
        }
      >
        {currentStock === 0 ? (
          <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-100">
            Habis (0) ✎
          </span>
        ) : currentStock <= 5 ? (
          <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-100">
            Menipis ({currentStock} {unit}) ✎
          </span>
        ) : (
          <span className="font-mono text-xs text-neutral-800 font-medium cursor-pointer hover:text-primary-700 underline decoration-dotted">
            {currentStock} {unit} ✎
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Update Stok Cepat</DialogTitle>
          <DialogDescription className="text-xs text-neutral-600 truncate">
            {title}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-medium">
              Sisa Stok ({unit})
            </label>
            <Input
              type="number"
              min="0"
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              className="h-10 text-sm font-mono"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoastBatchDialog({
  listingId,
  title,
  categorySlug,
}: {
  listingId: string;
  title: string;
  categorySlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roastedOn, setRoastedOn] = useState(new Date().toLocaleDateString("en-CA"));
  const [quantityKg, setQuantityKg] = useState("10");
  const [notes, setNotes] = useState("");

  if (categorySlug === "equipment") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantityKg);
    if (!roastedOn || isNaN(qty) || qty <= 0) {
      toast.error("Tanggal sangrai dan kuantitas kg valid wajib diisi.");
      return;
    }

    setLoading(true);
    const res = await addRoastBatchAction({
      listingId,
      roastedOn,
      quantityKg: qty,
      notes: notes.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Batch pemanggangan berhasil dicatat!");
      setOpen(false);
      setNotes("");
    } else {
      toast.error(res.error || "Gagal mencatat batch sangrai");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            title="Catat Batch Sangrai"
            aria-label={`Catat batch sangrai untuk ${title}`}
            className="text-amber-800 hover:text-amber-900 hover:bg-amber-50"
          />
        }
      >
        <Flame className="w-4 h-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Batch Pemanggangan</DialogTitle>
          <DialogDescription>
            {title} — Tambah batch sangrai terbaru untuk memperbarui tanggal sangrai dan memicu antrean waitlist secara otomatis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-medium text-neutral-800 block mb-1">
              Tanggal Sangrai (WIB) <span className="text-red-600">*</span>
            </label>
            <Input
              type="date"
              max={new Date().toLocaleDateString("en-CA")}
              value={roastedOn}
              onChange={(e) => setRoastedOn(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-800 block mb-1">
              Kuantitas Hasil Sangrai (kg) <span className="text-red-600">*</span>
            </label>
            <Input
              type="number"
              step="0.5"
              min="0.1"
              max="10000"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              placeholder="Contoh: 15"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-800 block mb-1">
              Catatan Batch Pemanggangan (Opsional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Profil sangrai, mesin roaster, atau catatan suhu..."
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Batch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ListingTable({ listings, className }: ListingTableProps) {
  if (listings.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Produk"
        description="Mulai tambahkan produk kopi Anda untuk ditampilkan di katalog."
        action={
          <Link
            href="/dashboard/listing/create"
            className={buttonVariants({ variant: "primary" })}
          >
            <Button variant="primary">Tambah Produk Pertama</Button>
          </Link>
        }
        className={className}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          "hidden md:block border border-neutral-300 bg-surface-base rounded-sm overflow-hidden",
          className,
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Foto</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => {
              const img = listing.images[0]?.url;
              const stock = listing.stock ?? 50;
              return (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-sm overflow-hidden bg-neutral-100 relative shrink-0">
                      {img && (
                        <Image
                          src={img}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-55">
                      <Link
                        href={`/product/${listing.slug}`}
                        className="font-medium text-neutral-900 truncate block hover:underline"
                      >
                        {listing.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isActiveBoost(listing) && (
                          <span className="text-xs font-mono text-neutral-600">
                            Boost aktif sampai{" "}
                            {new Intl.DateTimeFormat("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(listing.boostUntil!))}
                          </span>
                        )}
                        {listing.seller.isVerified && (
                          <VerifiedBadge size="sm" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-700">
                    {listing.category.name}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums font-medium text-primary-900">
                    {formatRupiah(listing.price)}
                  </TableCell>
                  <TableCell>
                    <QuickStockDialog
                      listingId={listing.id}
                      title={listing.title}
                      currentStock={stock}
                      unit={listing.unit}
                    />
                  </TableCell>
                  <TableCell>
                    <QuickStatusToggle
                      listingId={listing.id}
                      currentStatus={listing.status}
                      title={listing.title}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <RoastBatchDialog
                        listingId={listing.id}
                        title={listing.title}
                        categorySlug={listing.category.slug}
                      />
                      <Link
                        href={`/product/${listing.slug}`}
                        aria-label="Lihat produk"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Lihat produk"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/listing/${listing.id}/edit`}
                        aria-label="Edit produk"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-sm",
                        })}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit produk"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className={cn("md:hidden space-y-3", className)}>
        {listings.map((listing) => {
          const img = listing.images[0]?.url;
          return (
            <div
              key={listing.id}
              className="border border-neutral-300 bg-surface-base rounded-sm p-4"
            >
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-sm overflow-hidden bg-neutral-100 relative shrink-0">
                  {img && (
                    <Image
                      src={img}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${listing.slug}`}
                    className="font-medium text-neutral-900 text-sm truncate block hover:underline"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {listing.category.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="font-mono tabular-nums text-sm text-primary-900 font-semibold">
                      {formatRupiah(listing.price)}
                    </span>
                    <QuickStatusToggle
                      listingId={listing.id}
                      currentStatus={listing.status}
                      title={listing.title}
                    />
                    <QuickStockDialog
                      listingId={listing.id}
                      title={listing.title}
                      currentStock={listing.stock ?? 50}
                      unit={listing.unit}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                <div className="flex items-center gap-1.5">
                  {isActiveBoost(listing) && (
                    <span className="text-xs font-mono text-neutral-600">
                      Boost aktif sampai{" "}
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(listing.boostUntil!))}
                    </span>
                  )}
                  {listing.seller.isVerified && (
                    <VerifiedBadge size="sm" showLabel={false} />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <RoastBatchDialog
                    listingId={listing.id}
                    title={listing.title}
                    categorySlug={listing.category.slug}
                  />
                  <Link href={`/product/${listing.slug}`}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Lihat produk"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/listing/${listing.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit produk"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
