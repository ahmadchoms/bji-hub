import type { Metadata } from "next";
import { getCatalogCached, normalizeFilters } from "@/lib/data/cached-catalog";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { TasteMap, type TasteMapItem } from "@/components/coffee/taste-map";
import { logger } from "@/lib/logger";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Peta Sebaran Rasa Kopi Nusantara (Taste Map) • Biji Hub",
  description:
    "Jelajahi peta interaktif 2 dimensi sebaran keasaman (acidity) dan ketebalan rasa (body) kopi specialty Indonesia.",
};

export const revalidate = 120;

export default async function TasteMapPage() {
  const items: TasteMapItem[] = [];
  let excludedCount = 0;
  let loadError: string | null = null;

  try {
    const result = await getCatalogCached(JSON.stringify(normalizeFilters({ pageSize: 100 })));
    const allItems = result?.items || [];

    for (const l of allItems) {
      const tp = l.tasteProfile;
      if (
        tp &&
        typeof tp.acidityScore === "number" &&
        typeof tp.bodyScore === "number"
      ) {
        items.push({
          id: l.id,
          slug: l.slug,
          title: l.title,
          originRegion: tp.originRegion ?? undefined,
          roastLevel: tp.roastLevel ?? undefined,
          acidityScore: tp.acidityScore,
          bodyScore: tp.bodyScore,
          cuppingScore: tp.cuppingScore ?? null,
          price: Number(l.price),
        });
      } else {
        excludedCount++;
      }
    }
  } catch (err) {
    logger.error("taste_map.load_failed", err);
    loadError = "Gagal memuat peta sebaran rasa. Silakan coba beberapa saat lagi.";
  }

  return (
    <div className="py-8 md:py-12 bg-neutral-50/50 min-h-screen">
      <PageContainer>
        <div className="space-y-6">
          <SectionHeader
            title="Peta Sebaran Rasa Kopi Nusantara"
            subtitle="Temukan biji kopi yang cocok dengan selera Anda melalui koordinat rasa keasaman (acidity) dan ketebalan (body) dari berbagai daerah Nusantara."
          />

          {loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
              <div className="flex justify-center text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-red-800">{loadError}</p>
            </div>
          ) : (
            <>
              {excludedCount > 0 && (
                <p className="text-xs text-neutral-600">
                  Catatan: {excludedCount} produk belum memiliki skor rasa lengkap sehingga tidak ditampilkan di peta.
                </p>
              )}
              <div className="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-2xs">
                <TasteMap items={items} />
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
