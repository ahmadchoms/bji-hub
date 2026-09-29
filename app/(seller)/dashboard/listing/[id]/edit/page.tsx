import { getListingById, getCategories } from "@/lib/mock/repository";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";
import { notFound } from "next/navigation";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const [listing, categories] = await Promise.all([
    getListingById(id),
    getCategories(),
  ]);

  if (!listing) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Edit Produk"
        subtitle={listing.title}
      />
      <ListingForm
        categories={categories}
        isEditing
        defaultValues={{
          title: listing.title,
          categoryId: listing.categoryId,
          description: listing.description ?? "",
          price: listing.price,
          unit: listing.unit,
          minOrderQty: listing.minOrderQty,
          status: listing.status === "suspended" ? "archived" : listing.status,
          originRegion: listing.tasteProfile?.originRegion ?? "",
          processMethod: listing.tasteProfile?.processMethod,
          roastLevel: listing.tasteProfile?.roastLevel,
          flavorNotes: listing.tasteProfile?.flavorNotes ?? "",
          acidityScore: listing.tasteProfile?.acidityScore ?? 0,
          bodyScore: listing.tasteProfile?.bodyScore ?? 0,
          sweetnessScore: listing.tasteProfile?.sweetnessScore,
          aromaScore: listing.tasteProfile?.aromaScore,
          aftertasteScore: listing.tasteProfile?.aftertasteScore,
          roastDate: listing.tasteProfile?.roastDate
            ? new Date(listing.tasteProfile.roastDate).toISOString().split("T")[0]
            : "",
        }}
      />
    </div>
  );
}
