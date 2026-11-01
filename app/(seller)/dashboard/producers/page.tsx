import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth/session";
import { getProducers, getProducerAttributions } from "@/lib/data/producers";
import { SectionHeader } from "@/components/shared/section-header";
import { SellerProducerManager } from "@/components/dashboard/seller-producer-manager";

export const metadata: Metadata = {
  title: "Hubungan Produser & Petani | Dashboard Biji Hub",
  description: "Kelola relasi produser kopi, verifikasi asal kebun, dan transparansi rantai pasok.",
};

export const dynamic = "force-dynamic";

export default async function SellerProducersPage() {
  const { sellerId } = await requireSeller("/dashboard/producers");

  const [producers, attributions] = await Promise.all([
    getProducers(),
    getProducerAttributions({ sellerId }).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Hubungan Produser & Petani (Traceability)"
        subtitle="Ajukan dan pantau status persetujuan hubungan pasokan kopi dari petani atau koperasi kopi binaan toko Anda."
      />

      <SellerProducerManager
        attributions={attributions}
        producers={producers}
      />
    </div>
  );
}
