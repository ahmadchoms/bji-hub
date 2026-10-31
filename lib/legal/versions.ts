export type ConsentDocument = "terms" | "privacy" | "seller_agreement";

export const CURRENT_VERSIONS: Record<ConsentDocument, string> = {
  terms: "2026-10-v1",
  privacy: "2026-10-v1",
  seller_agreement: "2026-10-v1",
};

export const DOCUMENT_TITLES: Record<ConsentDocument, string> = {
  terms: "Syarat & Ketentuan Layanan",
  privacy: "Kebijakan Privasi Data Pengguna",
  seller_agreement: "Perjanjian Kerjasama Penjual",
};
