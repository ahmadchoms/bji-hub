"use client";

import { mockListings } from "@/lib/mock/data";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/components/shared/price-text";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, X, CheckCircle2 } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Aktif", variant: "default" },
  draft: { label: "Draf", variant: "secondary" },
  archived: { label: "Arsip", variant: "outline" },
  suspended: { label: "Ditangguhkan", variant: "destructive" },
};

export default function AdminModerasiPage() {
  const handleApprove = (title: string) => {
    toast.success(`Listing "${title}" disetujui.`);
  };

  const handleSuspend = (title: string) => {
    toast.error(`Listing "${title}" ditangguhkan.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Moderasi Listing"
        subtitle={`${mockListings.length} listing terdaftar di platform.`}
      />

      <div className="hidden md:block border border-neutral-300 bg-surface-base rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Foto</TableHead>
              <TableHead>Judul Listing</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockListings.map((listing) => {
              const statusConf = STATUS_LABELS[listing.status] ?? STATUS_LABELS.active;
              const img = listing.images[0]?.url;
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
                    <p className="font-medium text-neutral-900 truncate max-w-[200px]">{listing.title}</p>
                    <p className="text-[11px] text-neutral-500">{listing.category.name}</p>
                  </TableCell>
                  <TableCell className="text-neutral-700 text-sm">{listing.seller.businessName}</TableCell>
                  <TableCell className="font-mono tabular-nums font-medium text-primary-900 text-sm">
                    {formatRupiah(listing.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/product/${listing.slug}`}>
                        <Button variant="ghost" size="icon-sm" aria-label="Lihat">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Setujui"
                        className="text-status-success hover:bg-green-50"
                        onClick={() => handleApprove(listing.title)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Tangguhkan"
                        className="text-status-error hover:bg-red-50"
                        onClick={() => handleSuspend(listing.title)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {mockListings.map((listing) => {
          const statusConf = STATUS_LABELS[listing.status] ?? STATUS_LABELS.active;
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
                  <p className="font-medium text-sm text-neutral-900 truncate">{listing.title}</p>
                  <p className="text-[11px] text-neutral-500">{listing.seller.businessName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono tabular-nums text-sm font-medium text-primary-900">
                      {formatRupiah(listing.price)}
                    </span>
                    <Badge variant={statusConf.variant} className="text-xs">{statusConf.label}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-neutral-200">
                <Link href={`/product/${listing.slug}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye className="w-3.5 h-3.5" /> Lihat
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-status-success hover:bg-green-50 gap-1"
                  onClick={() => handleApprove(listing.title)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-status-error hover:bg-red-50 gap-1"
                  onClick={() => handleSuspend(listing.title)}
                >
                  <X className="w-3.5 h-3.5" /> Tangguhkan
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}