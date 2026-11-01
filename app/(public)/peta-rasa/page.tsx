import type { Metadata } from "next";
import { getCatalogCached, normalizeFilters } from "@/lib/data/cached-catalog";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { TasteMap, type TasteMapItem } from "@/components/coffee/taste-map";

export const metadata: Metadata = {
  title: "Peta Sebaran Rasa Kopi Nusantara (Taste Map) • Biji Hub",
  description:
    "Jelajahi peta interaktif 2 dimensi sebaran keasaman (acidity) dan ketebalan rasa (body) kopi specialty Indonesia.",
};

export const revalidate = 120;

export default async function TasteMapPage() {
  const result = await getCatalogCached(JSON.stringify(normalizeFilters({ pageSize: 100 })));
  const items: TasteMapItem[] = result.items
    .filter((l) => Boolean(l.tasteProfile))
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      originRegion: l.tasteProfile?.originRegion || "Nusantara",
      roastLevel: l.tasteProfile?.roastLevel || "Medium",
      acidityScore: l.tasteProfile?.acidityScore || 3,
      bodyScore: l.tasteProfile?.bodyScore || 3,
      cuppingScore: l.tasteProfile?.cuppingScore || null,
      price: Number(l.price),
    }));

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-screen">
      <PageContainer>
        <div className="space-y-6">
          <SectionHeader
            title="Peta Sebaran Rasa Kopi Nusantara"
            subtitle="Temukan biji kopi yang cocok dengan selera Anda melalui koordinat rasa keasaman (acidity) dan ketebalan (body) dari berbagai daerah Nusantara."
          />

          <div className="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-2xs">
            <TasteMap items={items} />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
