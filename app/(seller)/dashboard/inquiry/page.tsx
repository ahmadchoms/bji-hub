import { getInquiries } from "@/lib/data";
import { SectionHeader } from "@/components/shared/section-header";
import { InquiryList } from "@/components/dashboard/inquiry-list";
import { requireSeller } from "@/lib/auth/session";

export default async function DashboardInquiryPage() {
  const { sellerId } = await requireSeller();
  const inquiries = await getInquiries(sellerId);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pesan Masuk"
        subtitle={`${inquiries.length} inquiry dari calon pembeli.`}
      />
      <InquiryList inquiries={inquiries} />
    </div>
  );
}
