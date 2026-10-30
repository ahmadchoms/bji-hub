import type { Producer } from "@/types";

export const COFFEE_VARIETIES = [
  { id: "typica", name: "Typica", description: "Varietas tertua yang dibawa ke Indonesia, cita rasa floral dan acidity bersih." },
  { id: "bourbon", name: "Bourbon", description: "Varian alami dari Typica dengan profil sweetness kompleks dan creamy body." },
  { id: "catimor", name: "Catimor", description: "Persilangan Caturra dan Timor Hybrid, tahan karat daun dengan body mantap." },
  { id: "ateng", name: "Ateng", description: "Seleksi Catimor khas Aceh/Sumatra, produktif dengan rasa manis earthy." },
  { id: "s795", name: "S795 (Jember)", description: "Populer di Toraja dan Jawa, aroma floral, notes cokelat, dan sirup buah." },
  { id: "sigarar_utang", name: "Sigarar Utang", description: "Varietas unggul Tapanuli/Lintong, berbuah cepat dengan citarasa buah batu." },
  { id: "lini_s", name: "Lini S", description: "Seleksi varietas tahan penyakit asal India yang adaptif di berbagai terroir Indonesia." },
  { id: "gesha", name: "Gesha (Geisha)", description: "Varietas eksotis langka dengan aroma melati, bergamot, dan keasaman berkelas." },
] as const;

export type CoffeeVarietyId = (typeof COFFEE_VARIETIES)[number]["id"];

export const COFFEE_PROCESSES = [
  {
    id: "giling_basah",
    name: "Giling Basah (Wet Hulled)",
    isIndonesianHeritage: true,
    description: "Metode khas Nusantara di mana gabah dikupas pada kadar air 30-35%. Menghasilkan body tebal, syrupy, dan notes herbal khas.",
  },
  {
    id: "washed",
    name: "Washed / Full Washed",
    isIndonesianHeritage: false,
    description: "Pulping ceri dan fermentasi air untuk menghilangkan lendir. Menghasilkan acidity cerah dan clean cup.",
  },
  {
    id: "natural",
    name: "Natural / Dry Processed",
    isIndonesianHeritage: false,
    description: "Ceri dijemur utuh di bawah sinar matahari. Menghasilkan rasa buah yang intens, manis fermentasi, dan body penuh.",
  },
  {
    id: "honey",
    name: "Honey / Pulped Natural",
    isIndonesianHeritage: false,
    description: "Kulit buah dikupas namun lapisan lendir (mucilage) disisakan saat penjemuran. Manis alami dan keasaman lembut.",
  },
  {
    id: "anaerobic",
    name: "Anaerobic / Carbonic Maceration",
    isIndonesianHeritage: false,
    description: "Fermentasi ceri di tangki kedap oksigen terkontrol. Memunculkan aroma unik, tropical fruits, dan winey acidity.",
  },
] as const;

export type CoffeeProcessId = (typeof COFFEE_PROCESSES)[number]["id"];

export interface CertificationMeta {
  id: string;
  name: string;
  type: "geographic_indication" | "certification";
  description: string;
}

export const COFFEE_CERTIFICATIONS: Record<string, CertificationMeta> = {
  "indikasi-geografis": {
    id: "indikasi-geografis",
    name: "Indikasi Geografis (IG / GI)",
    type: "geographic_indication",
    description: "Sertifikasi resmi Kemenkumham yang menjamin keaslian asal geografis dan reputasi kualitas khas daerah terkait.",
  },
  "organik-indonesia": {
    id: "organik-indonesia",
    name: "Organik Indonesia",
    type: "certification",
    description: "Sertifikasi budidaya organik bebas pestisida dan pupuk kimia sintetis berstandar SNI Organik.",
  },
  "fair-trade": {
    id: "fair-trade",
    name: "Fair Trade Certified",
    type: "certification",
    description: "Standar perdagangan berkeadilan yang memastikan upah adil dan premi pembangunan komunitas bagi petani.",
  },
  "rainforest-alliance": {
    id: "rainforest-alliance",
    name: "Rainforest Alliance",
    type: "certification",
    description: "Memenuhi kriteria kelestarian lingkungan hayati, perlindungan hutan, dan hak pekerja kebun.",
  },
};

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Returns true only if producer claims have been verified by admin.
 */
export function isProducerVerified(
  producer: Pick<Producer, "claimsVerifiedAt"> | null | undefined
): boolean {
  return Boolean(producer?.claimsVerifiedAt);
}

/**
 * Returns verified certifications list only if claims have been verified by admin.
 * Per specification: "Label sertifikasi/GI hanya tampil setelah bukti diunggah dan diverifikasi admin (claims_verified_at)."
 */
export function getVerifiedCertifications(
  producer: Pick<Producer, "certifications" | "claimsVerifiedAt"> | null | undefined
): string[] {
  if (!producer || !producer.claimsVerifiedAt) {
    return [];
  }
  return Array.isArray(producer.certifications) ? producer.certifications : [];
}

/**
 * Formats altitude range or single altitude value into clean display string.
 */
export function formatAltitude(
  min?: number | null,
  max?: number | null
): string | null {
  if (min && max && min !== max) {
    return `${min.toLocaleString("id-ID")} - ${max.toLocaleString("id-ID")} m dpl`;
  }
  if (min) {
    return `${min.toLocaleString("id-ID")} m dpl`;
  }
  if (max) {
    return `${max.toLocaleString("id-ID")} m dpl`;
  }
  return null;
}

/**
 * Formats harvest month (1-12) to Indonesian month name.
 */
export function formatHarvestMonth(month?: number | null): string | null {
  if (!month || month < 1 || month > 12) return null;
  return INDONESIAN_MONTHS[month - 1];
}
