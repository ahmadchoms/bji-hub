import { getListingById, getCategories } from "@/lib/data";
import { getProducers } from "@/lib/data/producers";
import { getRoastBatchesByListing } from "@/lib/coffee/roast-batch";
import { SectionHeader } from "@/components/shared/section-header";
import { ListingForm } from "@/components/dashboard/listing-form";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth/session";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const { id } = await params;
  const { sellerId } = await requireSeller(`/dashboard/listing/${id}`);
  const [listing, categories, producers, batches] = await Promise.all([
    getListingById(id),
    getCategories(),
    getProducers().catch(() => []),
    getRoastBatchesByListing(id).catch(() => []),
  ]);

  if (!listing || listing.sellerId !== sellerId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Edit Produk" subtitle={listing.title} />
      <ListingForm
        categories={categories}
        producers={producers}
        hasRoastBatches={batches.length > 0}
        isEditing
        listingId={listing.id}
        defaultValues={{
          title: listing.title,
          categoryId: listing.categoryId,
          description: listing.description ?? "",
          price: listing.price,
          unit: listing.unit,
          minOrderQty: listing.minOrderQty,
          stock: listing.stock ?? 100,
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
          cuppingScore: listing.tasteProfile?.cuppingScore,
          altitude: listing.tasteProfile?.altitude ?? "",
          cropYear: listing.tasteProfile?.cropYear ?? "",
          moistureContent: listing.tasteProfile?.moistureContent,
          producerId: listing.tasteProfile?.producerId ?? undefined,
          lotCode: listing.tasteProfile?.lotCode ?? "",
          varieties: listing.tasteProfile?.varieties ?? [],
          harvestMonth: listing.tasteProfile?.harvestMonth ?? undefined,
          fermentationHours: listing.tasteProfile?.fermentationHours ?? undefined,
          dryingDays: listing.tasteProfile?.dryingDays ?? undefined,
          nextRoastDate: listing.nextRoastDate ?? "",
          flavorTags: listing.flavorTags ?? [],
          images: [...listing.images]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => ({ url: image.url, path: image.id })),
          roastDate: listing.tasteProfile?.roastDate
            ? new Date(listing.tasteProfile.roastDate)
                .toISOString()
                .split("T")[0]
            : "",
        }}
      />
    </div>
  );
}
