export type BrewMethodId =
  | "v60"
  | "aeropress"
  | "french_press"
  | "moka_pot"
  | "espresso"
  | "tubruk"
  | "vietnam_drip"
  | "cold_brew";

export interface BrewMethod {
  id: BrewMethodId;
  name: string;
  recommendedGrind: string;
  defaultRatio: number; // e.g. 16 for 1:16
  waterTemp: string;
  brewTime: string;
  description: string;
  guideStep: string;
}

export const GRIND_OPTIONS = [
  "Biji Utuh (Whole Bean)",
  "Kasar (French Press / Cold Brew)",
  "Sedang (V60 / Pour Over)",
  "Halus (Tubruk / Moka Pot / Vietnam Drip)",
  "Sangat Halus (Espresso)",
] as const;

export type GrindOption = (typeof GRIND_OPTIONS)[number];

export const BREW_METHODS: Record<BrewMethodId, BrewMethod> = {
  v60: {
    id: "v60",
    name: "V60 / Pour Over",
    recommendedGrind: "Sedang (V60 / Pour Over)",
    defaultRatio: 16,
    waterTemp: "90 - 94°C",
    brewTime: "2:30 - 3:15 menit",
    description: "Menonjolkan kejernihan rasa, notes buah, dan aroma floral yang bersih.",
    guideStep: "Tuang air melingkar secara bertahap (blooming 45 detik, lalu 2-3 kali tuang).",
  },
  aeropress: {
    id: "aeropress",
    name: "AeroPress",
    recommendedGrind: "Sedang (V60 / Pour Over)",
    defaultRatio: 14,
    waterTemp: "85 - 88°C",
    brewTime: "1:30 - 2:00 menit",
    description: "Body tebal seimbang dengan rasa manis manis dan acidity lembut.",
    guideStep: "Aduk 10 detik, pasang plunger, diamkan 1 menit lalu tekan perlahan selama 30 detik.",
  },
  french_press: {
    id: "french_press",
    name: "French Press",
    recommendedGrind: "Kasar (French Press / Cold Brew)",
    defaultRatio: 15,
    waterTemp: "92 - 95°C",
    brewTime: "4:00 menit",
    description: "Tekstur pekat (full body) dan minyak alami kopi yang kaya.",
    guideStep: "Seduh air panas, diamkan 4 menit, bersihkan ampas di permukaan, lalu tekan plunger.",
  },
  moka_pot: {
    id: "moka_pot",
    name: "Moka Pot",
    recommendedGrind: "Halus (Tubruk / Moka Pot / Vietnam Drip)",
    defaultRatio: 10,
    waterTemp: "Air panas di wadah bawah",
    brewTime: "2:00 - 3:00 menit",
    description: "Kopi kental intens mirip espresso rumahan tradisional.",
    guideStep: "Gunakan api kecil-sedang, matikan kompor saat cairan kopi mulai mengalir ke atas.",
  },
  espresso: {
    id: "espresso",
    name: "Mesin Espresso",
    recommendedGrind: "Sangat Halus (Espresso)",
    defaultRatio: 2,
    waterTemp: "91 - 94°C",
    brewTime: "25 - 30 detik",
    description: "Ekstraksi bertekanan tinggi 9 bar dengan crema tebal dan rasa pekat.",
    guideStep: "Tamping merata dan padat, ekstrak yield 36-40g dari 18-20g bubuk dalam 27 detik.",
  },
  tubruk: {
    id: "tubruk",
    name: "Kopi Tubruk Tradisional",
    recommendedGrind: "Halus (Tubruk / Moka Pot / Vietnam Drip)",
    defaultRatio: 13,
    waterTemp: "92 - 96°C",
    brewTime: "4:00 menit",
    description: "Cara seduh otentik Indonesia dengan ekstraksi murni tanpa saringan kertas.",
    guideStep: "Seduh langsung bubuk kopi dengan air mendidih, diamkan 4 menit hingga ampas mengendap sempurna.",
  },
  vietnam_drip: {
    id: "vietnam_drip",
    name: "Vietnam Drip",
    recommendedGrind: "Halus (Tubruk / Moka Pot / Vietnam Drip)",
    defaultRatio: 12,
    waterTemp: "90 - 95°C",
    brewTime: "4:00 - 5:00 menit",
    description: "Tetesan lambat kental pekat, sangat nikmat dipadu krimer manis kental.",
    guideStep: "Ratakan bubuk kopi di filter, tekan tamper secukupnya, tuang sedikit air untuk blooming.",
  },
  cold_brew: {
    id: "cold_brew",
    name: "Cold Brew",
    recommendedGrind: "Kasar (French Press / Cold Brew)",
    defaultRatio: 8,
    waterTemp: "Air suhu ruang / dingin",
    brewTime: "12 - 18 jam",
    description: "Rendaman dingin rendah asam dengan rasa manis alami karamel.",
    guideStep: "Rendam bubuk kasar di botol kaca dalam kulkas selama 14-16 jam, saring dengan filter kain/kertas.",
  },
};

export function getGrindForBrewMethod(methodId: BrewMethodId): string {
  return BREW_METHODS[methodId]?.recommendedGrind || "Sedang (V60 / Pour Over)";
}

export function calculateBrewRatio({
  coffeeGrams,
  waterMl,
  ratio,
}: {
  coffeeGrams?: number;
  waterMl?: number;
  ratio: number;
}): { coffeeGrams: number; waterMl: number } {
  const safeRatio = ratio > 0 ? ratio : 15;
  if (coffeeGrams && coffeeGrams > 0) {
    return {
      coffeeGrams: Math.round(coffeeGrams * 10) / 10,
      waterMl: Math.round(coffeeGrams * safeRatio),
    };
  }
  if (waterMl && waterMl > 0) {
    return {
      coffeeGrams: Math.round((waterMl / safeRatio) * 10) / 10,
      waterMl: Math.round(waterMl),
    };
  }
  return {
    coffeeGrams: 15,
    waterMl: Math.round(15 * safeRatio),
  };
}
