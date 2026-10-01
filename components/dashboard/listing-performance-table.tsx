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
      <p className="font-display text-sm italic text-neutral-500">
        Belum ada listing.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-130 border-collapse text-sm">
        <caption className="sr-only">Performa listing 30 hari terakhir</caption>
        <thead>
          <tr className="border-b border-neutral-300 text-left text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <th scope="col" className="py-2 pr-4 font-normal">
              Listing
            </th>
            <th scope="col" className="px-3 py-2 text-right font-normal">
              Dilihat
            </th>
            <th scope="col" className="px-3 py-2 text-right font-normal">
              Klik kontak
            </th>
            <th scope="col" className="px-3 py-2 text-right font-normal">
              Rasio
            </th>
            {showAds && (
              <th scope="col" className="py-2 pl-3 text-right font-normal">
                Tayangan iklan
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.listingId}
              className="border-b border-neutral-300 align-top"
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/product/${row.slug}`}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {row.title}
                </Link>
                {row.boostUntil && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Iklan aktif sampai{" "}
                    {dateFmt.format(new Date(row.boostUntil))}
                  </p>
                )}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {nf.format(row.views)}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {nf.format(row.clicks)}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums">
                {row.conversionRate}%
              </td>
              {showAds && (
                <td className="py-3 pl-3 text-right font-mono tabular-nums">
                  {row.impressions > 0 ? nf.format(row.impressions) : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
