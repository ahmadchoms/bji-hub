import { getInquiries } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { InquiryList } from "@/components/dashboard/inquiry-list";

const MOCK_SELLER_ID = "seller-1";

export default async function DashboardInquiryPage() {
  const inquiries = await getInquiries(MOCK_SELLER_ID);

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
