import { requireRole } from "@/lib/auth/session";
import { getReportedReviews } from "@/lib/data/reviews";
import { AdminReviewModerator } from "@/components/dashboard/admin-review-moderator";

export const metadata = {
  title: "Moderasi Ulasan | Admin Biji Hub",
};

export default async function AdminReviewsPage() {
  await requireRole(["admin"], "/admin/reviews");
  const reviews = await getReportedReviews();

  return <AdminReviewModerator initialReviews={reviews} />;
}
