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

export async function fetchProvinces(): Promise<RegionItem[]> {
  const cached = cache.get("provinces");
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/provinces.json`);
  if (!res.ok) throw new Error("Gagal mengambil data provinsi");
  const raw: { id: string; name: string }[] = await res.json();
  const data = raw.map((item) => ({
    id: item.id,
    name: formatTitleCase(item.name),
  }));

  cache.set("provinces", data);
  return data;
}

export async function fetchRegencies(provinceId: string): Promise<RegionItem[]> {
  if (!provinceId) return [];

  const key = `regencies:${provinceId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
  if (!res.ok) throw new Error("Gagal mengambil data kota/kabupaten");
  const raw: { id: string; name: string }[] = await res.json();
  const data = raw.map((item) => ({
    id: item.id,
    name: formatTitleCase(item.name),
  }));

  cache.set(key, data);
  return data;
}
