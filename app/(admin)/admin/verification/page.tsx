"use client";

import { mockSellers } from "@/lib/mock/data";
import { SectionHeader } from "@/components/shared/section-header";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

const pendingSellers = mockSellers.filter((s) => !s.isVerified);

export default function AdminVerificationPage() {
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-2 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal">Nama Bisnis</th>
                <th className="py-2 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal">Lokasi</th>
                <th className="py-2 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal">Tier</th>
                <th className="py-2 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal">WhatsApp</th>
                <th className="py-2 pr-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal text-right">Tanggal Daftar</th>
                <th className="py-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingSellers.map((seller) => (
                <tr key={seller.id} className="border-b border-neutral-300">
                  <td className="py-2.5 pr-4 font-medium text-neutral-900">{seller.businessName}</td>
                  <td className="py-2.5 pr-4 text-neutral-600">{seller.city}, {seller.province}</td>
                  <td className="py-2.5 pr-4 text-neutral-600">{seller.tier}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-neutral-600">{seller.whatsappNumber}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-neutral-500 text-right tabular-nums">
                    {new Date(seller.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-medium text-status-success hover:underline cursor-pointer mr-3"
                      onClick={() => handleApprove(seller.businessName)}
                    >
                      Setujui
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-status-error hover:underline cursor-pointer"
                      onClick={() => handleReject(seller.businessName)}
                    >
                      Tolak
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
