"use client";

import { mockSellers } from "@/lib/mock/data";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

const pendingSellers = mockSellers.filter((s) => !s.isVerified);

export default function AdminVerifikasiPage() {
  const handleApprove = (name: string) => {
    toast.success(`Seller "${name}" berhasil diverifikasi.`);
  };

  const handleReject = (name: string) => {
    toast.error(`Pengajuan verifikasi "${name}" ditolak.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Antrean Verifikasi"
        subtitle={`${pendingSellers.length} seller menunggu verifikasi.`}
      />

      {pendingSellers.length === 0 ? (
        <EmptyState
          title="Semua Seller Terverifikasi"
          description="Tidak ada antrean verifikasi saat ini."
        />
      ) : (
        <div className="space-y-3">
          {pendingSellers.map((seller) => (
            <div
              key={seller.id}
              className="border border-neutral-300 bg-surface-base rounded-sm p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg text-neutral-900 font-semibold">
                      {seller.businessName}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">Menunggu</Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {seller.city}, {seller.province}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">{seller.tier}</Badge>
              </div>

              {seller.bio && (
                <p className="text-sm text-neutral-600">{seller.bio}</p>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 font-mono flex-1">
                  WA: {seller.whatsappNumber} · {new Date(seller.createdAt).toLocaleDateString("id-ID")}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-status-error border-status-error/30"
                    onClick={() => handleReject(seller.businessName)}
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(seller.businessName)}
                  >
                    Setujui
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}