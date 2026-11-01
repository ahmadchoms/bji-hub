import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import { CuppingCardForm } from "./cupping-card-form";
import { getLotCuppingData } from "@/lib/data/lots";

interface PageProps {
  params: Promise<{ lot_code: string }>;
}

export default async function LotCuppingCardPage({ params }: PageProps) {
  const { lot_code } = await params;
  const decodedLot = decodeURIComponent(lot_code).trim();

  // Validate lot_code format: alphanumeric and hyphens only, 3-40 chars
  if (!/^[A-Za-z0-9-]{3,40}$/.test(decodedLot)) {
    notFound();
  }

  const lotData = await getLotCuppingData(decodedLot);

  if (!lotData) {
    notFound();
  }

  return (
    <div className="bg-neutral-50/50 min-h-screen py-8">
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-6">
          <Link href="/catalog">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5 mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog
            </Button>
          </Link>

          {/* Header Card */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono font-bold text-amber-600">
                  LOT: {lotData.lot_code}
                </Badge>
                {lotData.cupping_score && (
                  <Badge variant="secondary" className="text-xs font-bold gap-1 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                    <Sparkles className="h-3 w-3" /> SCA {lotData.cupping_score}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Panen: {lotData.crop_year || "2026"}</span>
            </div>

            <h1 className="text-2xl font-bold font-display text-foreground">
              {lotData.listing_title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-muted-foreground block">Asal Daerah</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-amber-600" /> {lotData.origin_region}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Produser / Petani</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {lotData.producer_name || "Petani Mitra"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Proses Pascapanen</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {lotData.process_method}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Ketinggian Kebun</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {lotData.altitude || "1400+ mdpl"}
                </span>
              </div>
            </div>

            {lotData.listing_slug && (
              <div className="pt-2 flex justify-end">
                <Link href={`/catalog/${lotData.listing_slug}`}>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Beli Biji Lot Ini
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Interactive Cupping Card Form */}
          <CuppingCardForm
            lotCode={lotData.lot_code}
            listingId={lotData.listing_id}
            officialNotes={lotData.flavor_notes || undefined}
            officialScores={{
              acidity: Number(lotData.acidity_score || 4),
              body: Number(lotData.body_score || 3.5),
              sweetness: Number(lotData.sweetness_score || 4),
              aroma: Number(lotData.aroma_score || 4),
              aftertaste: Number(lotData.aftertaste_score || 4),
            }}
          />
        </div>
      </PageContainer>
    </div>
  );
}
