import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getPendingVerifications } from "@/lib/data";
import { VerificationActions } from "@/components/dashboard/verification-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar } from "lucide-react";

export default async function AdminVerificationPage() {
  const pendingSellers = await getPendingVerifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Antrean Verifikasi"
          subtitle="Tinjau dan proses permohonan status terverifikasi mitra seller."
        />
        {pendingSellers.length > 0 && (
          <Badge
            variant="secondary"
            className="w-fit font-mono text-xs px-2.5 py-1"
          >
            {pendingSellers.length} Menunggu
          </Badge>
        )}
      </div>

      {pendingSellers.length === 0 ? (
        <EmptyState
          title="Semua Seller Terverifikasi"
          description="Tidak ada antrean verifikasi yang membutuhkan tindakan saat ini."
        />
      ) : (
        <div className="border border-neutral-300 bg-surface-base rounded-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bisnis</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSellers.map((seller) => (
                <TableRow
                  key={seller.id}
                  className="hover:bg-neutral-50/60 transition-colors border-neutral-200/60"
                >
                  <TableCell className="font-medium text-neutral-900">
                    <span className="font-semibold block">
                      {seller.businessName}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      ID: {seller.id.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-600 text-xs">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        {seller.city}, {seller.province}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-medium text-[11px] uppercase tracking-wide border-neutral-300 text-neutral-700 bg-neutral-50/50"
                    >
                      {seller.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-neutral-600">
                    <a
                      href={`https://wa.me/${seller.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-neutral-900 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      {seller.whatsappNumber}
                    </a>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-neutral-500 tabular-nums">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      {new Date(seller.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end">
                      <VerificationActions
                        sellerId={seller.id}
                        name={seller.businessName}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
