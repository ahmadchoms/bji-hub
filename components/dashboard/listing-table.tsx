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
import { Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { quickUpdateStockAction } from "@/actions/seller.actions";
import { toast } from "sonner";

interface ListingTableProps {
  listings: ListingWithRelations[];
  className?: string;
}

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  active: { label: "Aktif", variant: "default" },
  draft: { label: "Draf", variant: "secondary" },
  archived: { label: "Arsip", variant: "outline" },
  suspended: { label: "Ditangguhkan", variant: "destructive" },
};

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
          <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-100">
            Habis (0) ✎
          </span>
        ) : currentStock <= 5 ? (
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-100">
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
          <DialogDescription className="text-xs text-neutral-500 truncate">
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
              const statusConf =
                STATUS_LABELS[listing.status] ?? STATUS_LABELS.active;
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
                          <span className="text-[10px] font-mono text-neutral-500">
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
                    <Badge variant={statusConf.variant} className="text-xs">
                      {statusConf.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
          const statusConf =
            STATUS_LABELS[listing.status] ?? STATUS_LABELS.active;
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
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {listing.category.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="font-mono tabular-nums text-sm text-primary-900 font-semibold">
                      {formatRupiah(listing.price)}
                    </span>
                    <Badge variant={statusConf.variant} className="text-xs">
                      {statusConf.label}
                    </Badge>
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
                    <span className="text-[10px] font-mono text-neutral-500">
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
