import staticRegions from "@/lib/data/regions-static.json";

export interface RegionItem {
  id: string;
  name: string;
}

const cache = new Map<string, RegionItem[]>();

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

export async function fetchProvinces(): Promise<RegionItem[]> {
  const cached = cache.get("provinces");
  if (cached) return cached;

  const data: RegionItem[] = staticRegions.provinces as RegionItem[];
  cache.set("provinces", data);
  return data;
}

export async function fetchRegencies(provinceIdOrName: string): Promise<RegionItem[]> {
  if (!provinceIdOrName) return [];

  const key = `regencies:${provinceIdOrName}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const trimmed = provinceIdOrName.trim();
  const regenciesMap = staticRegions.regenciesByProvince as Record<string, RegionItem[]>;

  // 1. Direct ID match (e.g. "32", "11")
  if (regenciesMap[trimmed]) {
    const data = regenciesMap[trimmed];
    cache.set(key, data);
    return data;
  }

  // 2. Match by province name or aliases
  const norm = trimmed.toLowerCase();
  const matchedProvince = staticRegions.provinces.find(
    (p) =>
      p.id === trimmed ||
      p.name.toLowerCase() === norm ||
      (norm.includes("yogyakarta") && p.id === "34") ||
      (norm.includes("jakarta") && p.id === "31") ||
      (norm.includes("bangka") && p.id === "19") ||
      (norm.includes("riau") && norm.includes("kep") && p.id === "21")
  );

  if (matchedProvince && regenciesMap[matchedProvince.id]) {
    const data = regenciesMap[matchedProvince.id];
    cache.set(key, data);
    return data;
  }

  // 3. Fallback: try external API if id is unknown, but never throw
  try {
    const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";
    const res = await fetch(`${BASE_URL}/regencies/${encodeURIComponent(trimmed)}.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const raw: { id: string; name: string }[] = await res.json();
      const data = raw.map((item) => ({
        id: item.id,
        name: formatTitleCase(item.name),
      }));
      cache.set(key, data);
      return data;
    }
  } catch {
    // ignore: network failure falls back to empty array
  }

  return [];
}
