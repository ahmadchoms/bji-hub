import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth/session";
import { getVerifiedProducersAction, getProducerAttributionsAction } from "@/actions/producer.actions";
import { SectionHeader } from "@/components/shared/section-header";
import { SellerProducerManager } from "@/components/dashboard/seller-producer-manager";

export const metadata: Metadata = {
  title: "Hubungan Produser & Petani | Dashboard Biji Hub",
  description: "Kelola relasi produser kopi, verifikasi asal kebun, dan transparansi rantai pasok.",
};

export const dynamic = "force-dynamic";

export default async function SellerProducersPage() {
  const { sellerId } = await requireSeller("/dashboard/producers");

  const [producersRes, attributionsRes] = await Promise.all([
    getVerifiedProducersAction(),
    getProducerAttributionsAction({ sellerId }),
  ]);

  const producers = producersRes.success ? producersRes.data : [];
  const attributions = attributionsRes.success ? attributionsRes.data : [];

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
