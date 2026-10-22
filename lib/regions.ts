export interface RegionItem {
  id: string;
  name: string;
}

const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

function formatTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/\bDki\b/g, "DKI")
    .replace(/\BDiy\b/g, "DIY");
}

const cache = new Map<string, RegionItem[]>();

const FALLBACK_PROVINCES: RegionItem[] = [
  { id: "11", name: "Aceh" },
  { id: "12", name: "Sumatera Utara" },
  { id: "13", name: "Sumatera Barat" },
  { id: "14", name: "Riau" },
  { id: "15", name: "Jambi" },
  { id: "16", name: "Sumatera Selatan" },
  { id: "17", name: "Bengkulu" },
  { id: "18", name: "Lampung" },
  { id: "19", name: "Kepulauan Bangka Belitung" },
  { id: "21", name: "Kepulauan Riau" },
  { id: "31", name: "DKI Jakarta" },
  { id: "32", name: "Jawa Barat" },
  { id: "33", name: "Jawa Tengah" },
  { id: "34", name: "DIY" },
  { id: "35", name: "Jawa Timur" },
  { id: "36", name: "Banten" },
  { id: "51", name: "Bali" },
  { id: "52", name: "Nusa Tenggara Barat" },
  { id: "53", name: "Nusa Tenggara Timur" },
  { id: "61", name: "Kalimantan Barat" },
  { id: "62", name: "Kalimantan Tengah" },
  { id: "63", name: "Kalimantan Selatan" },
  { id: "64", name: "Kalimantan Timur" },
  { id: "65", name: "Kalimantan Utara" },
  { id: "71", name: "Sulawesi Utara" },
  { id: "72", name: "Sulawesi Tengah" },
  { id: "73", name: "Sulawesi Selatan" },
  { id: "74", name: "Sulawesi Tenggara" },
  { id: "75", name: "Gorontalo" },
  { id: "76", name: "Sulawesi Barat" },
  { id: "81", name: "Maluku" },
  { id: "82", name: "Maluku Utara" },
  { id: "91", name: "Papua Barat" },
  { id: "92", name: "Papua" },
  { id: "93", name: "Papua Selatan" },
  { id: "94", name: "Papua Tengah" },
  { id: "95", name: "Papua Pegunungan" },
  { id: "96", name: "Papua Barat Daya" },
];

export async function fetchProvinces(): Promise<RegionItem[]> {
  const cached = cache.get("provinces");
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE_URL}/provinces.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Gagal mengambil data provinsi");
    const raw: { id: string; name: string }[] = await res.json();
    const data = raw.map((item) => ({
      id: item.id,
      name: formatTitleCase(item.name),
    }));

    cache.set("provinces", data);
    return data;
  } catch {
    // ignore: network failure fallback to static province list
    cache.set("provinces", FALLBACK_PROVINCES);
    return FALLBACK_PROVINCES;
  }
}

export async function fetchRegencies(provinceId: string): Promise<RegionItem[]> {
  if (!provinceId) return [];

  const key = `regencies:${provinceId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("Gagal mengambil data kota/kabupaten");
  const raw: { id: string; name: string }[] = await res.json();
  const data = raw.map((item) => ({
    id: item.id,
    name: formatTitleCase(item.name),
  }));

  cache.set(key, data);
  return data;
}
