import Link from "next/link";
import type { ListingPerformance } from "@/types";

interface ListingPerformanceTableProps {
  rows: ListingPerformance[];
  showAds: boolean;
}

const nf = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function ListingPerformanceTable({
  rows,
  showAds,
}: ListingPerformanceTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
        <p className="text-xs font-medium text-neutral-500">
          Belum ada data performa listing.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-130 border-collapse text-xs">
          <caption className="sr-only">
            Performa listing 30 hari terakhir
          </caption>
          <thead>
            <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-left text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
              <th scope="col" className="py-3 px-4 font-semibold">
                Listing
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Dilihat
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Klik Kontak
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Rasio
              </th>
              {showAds && (
                <th scope="col" className="py-3 px-4 text-right font-semibold">
                  Tayangan Iklan
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <tr
                key={row.listingId}
                className="transition-colors hover:bg-neutral-50/50"
              >
                {/* Kolom Judul & Badge Iklan */}
                <td className="py-3.5 px-4 min-h-13">
                  <div className="flex flex-col justify-center gap-1">
                    <Link
                      href={`/product/${row.slug}`}
                      className="font-medium text-neutral-900 transition-colors hover:text-primary-700 hover:underline line-clamp-1"
                    >
                      {row.title}
                    </Link>
                    {row.boostUntil ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                          Iklan aktif s/d{" "}
                          {dateFmt.format(new Date(row.boostUntil))}
                        </span>
                      </div>
                    ) : (
                      /* Spacer transparan agar tinggi baris tetap simetris & seimbang */
                      <div className="h-4.5 aria-hidden:true" />
                    )}
                  </div>
                </td>

                {/* Kolom Angka (Menggunakan Alignment Center / Middle Vertikal Bawaan Table) */}
                <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-neutral-800 align-middle">
                  {nf.format(row.views)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-neutral-800 align-middle">
                  {nf.format(row.clicks)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-neutral-800 align-middle">
                  <span className="inline-block rounded-md bg-neutral-100/80 px-1.5 py-0.5 text-neutral-700">
                    {row.conversionRate}%
                  </span>
                </td>
                {showAds && (
                  <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold tabular-nums text-neutral-800 align-middle">
                    {row.impressions > 0 ? (
                      nf.format(row.impressions)
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
