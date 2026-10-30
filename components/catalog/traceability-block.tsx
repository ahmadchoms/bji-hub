import Link from "next/link";
import { ShieldCheck, MapPin, Award, Sprout, Calendar, Clock, SunMedium } from "lucide-react";
import type { TasteProfile } from "@/types";
import {
  COFFEE_CERTIFICATIONS,
  getVerifiedCertifications,
  formatHarvestMonth,
} from "@/lib/coffee/taxonomy";

interface TraceabilityBlockProps {
  tasteProfile?: TasteProfile | null;
  className?: string;
}

export function TraceabilityBlock({
  tasteProfile,
  className = "",
}: TraceabilityBlockProps) {
  if (!tasteProfile) return null;

  const producer = tasteProfile.producer;
  const verifiedCerts = getVerifiedCertifications(producer);
  const harvestMonthName = formatHarvestMonth(tasteProfile.harvestMonth);

  return (
    <div className={`space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary-700" aria-hidden="true" />
          <h3 className="font-display text-base font-semibold text-neutral-900">
            Asal-usul & Ketertelusuran
          </h3>
        </div>
        {producer?.claimsVerifiedAt && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Klaim Terverifikasi</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Produser / Petani */}
        <div className="space-y-1">
          <span className="font-mono text-neutral-600 uppercase tracking-wider block">
            Produser / Pengolah
          </span>
          {producer ? (
            <Link
              href={`/petani/${producer.slug}`}
              className="font-medium text-primary-800 hover:text-primary-900 hover:underline inline-flex items-center gap-1 text-sm coarse:min-h-11"
            >
              <span>{producer.name}</span>
              <span className="rounded bg-neutral-200/80 px-1.5 py-0.5 text-xs text-neutral-700 capitalize font-sans">
                {producer.kind}
              </span>
            </Link>
          ) : (
            <span className="text-sm font-medium text-neutral-800">
              Mitra Petani Terpilih
            </span>
          )}
        </div>

        {/* Daerah Asal / Terroir */}
        <div className="space-y-1">
          <span className="font-mono text-neutral-600 uppercase tracking-wider block">
            Wilayah / Terroir
          </span>
          <Link
            href="/asal-kopi"
            className="font-medium text-primary-800 hover:text-primary-900 hover:underline inline-flex items-center gap-1 text-sm coarse:min-h-11"
          >
            <span>{tasteProfile.originRegion}</span>
            {tasteProfile.altitude && (
              <span className="text-xs text-neutral-600 font-normal">
                ({tasteProfile.altitude})
              </span>
            )}
          </Link>
        </div>

        {/* Kode Lot */}
        {tasteProfile.lotCode && (
          <div className="space-y-1">
            <span className="font-mono text-neutral-600 uppercase tracking-wider block">
              Identitas Lot
            </span>
            <span className="inline-block font-mono text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 px-2 py-0.5 rounded">
              {tasteProfile.lotCode}
            </span>
          </div>
        )}

        {/* Varietas */}
        {tasteProfile.varieties && tasteProfile.varieties.length > 0 && (
          <div className="space-y-1">
            <span className="font-mono text-neutral-600 uppercase tracking-wider block flex items-center gap-1">
              <Sprout className="h-3 w-3 text-emerald-700" aria-hidden="true" />
              Varietas Tanaman
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {tasteProfile.varieties.join(", ")}
            </span>
          </div>
        )}

        {/* Waktu Panen */}
        {harvestMonthName && (
          <div className="space-y-1">
            <span className="font-mono text-neutral-600 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3 w-3 text-neutral-600" aria-hidden="true" />
              Bulan Panen
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {harvestMonthName} {tasteProfile.cropYear ? `(${tasteProfile.cropYear})` : ""}
            </span>
          </div>
        )}

        {/* Proses Pasca Panen: Fermentasi & Penjemuran */}
        {(tasteProfile.fermentationHours || tasteProfile.dryingDays) && (
          <div className="space-y-1">
            <span className="font-mono text-neutral-600 uppercase tracking-wider block">
              Protokol Pengolahan
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-800 font-medium">
              {tasteProfile.fermentationHours ? (
                <span className="inline-flex items-center gap-1 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                  <Clock className="h-3 w-3 text-amber-600" aria-hidden="true" />
                  Fermentasi {tasteProfile.fermentationHours} jam
                </span>
              ) : null}
              {tasteProfile.dryingDays ? (
                <span className="inline-flex items-center gap-1 bg-white border border-neutral-200 px-2 py-0.5 rounded">
                  <SunMedium className="h-3 w-3 text-amber-600" aria-hidden="true" />
                  Penjemuran {tasteProfile.dryingDays} hari
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Sertifikasi & Indikasi Geografis (Hanya jika terverifikasi) */}
      {verifiedCerts.length > 0 && (
        <div className="pt-2 border-t border-neutral-200 space-y-2">
          <span className="font-mono text-xs text-neutral-600 uppercase tracking-wider block flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Sertifikasi & Indikasi Geografis Terverifikasi
          </span>
          <div className="flex flex-wrap gap-2">
            {verifiedCerts.map((certKey) => {
              const meta = COFFEE_CERTIFICATIONS[certKey];
              const label = meta ? meta.name : certKey;
              return (
                <span
                  key={certKey}
                  className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-900"
                  title={meta?.description}
                >
                  <Award className="h-3 w-3 text-amber-700" aria-hidden="true" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
