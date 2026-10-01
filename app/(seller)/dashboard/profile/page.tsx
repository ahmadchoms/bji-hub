import { getSellerById } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { requireSeller } from "@/lib/auth/session";

export default async function DashboardProfilPage() {
  const { sellerId } = await requireSeller();
  const seller = await getSellerById(sellerId);

  if (!seller) {
    return <p className="text-neutral-500">Data seller tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profil Toko"
        subtitle="Kelola informasi toko dan pengaturan verifikasi."
      />
      <ProfileForm seller={seller} />
    </div>
  );
}
