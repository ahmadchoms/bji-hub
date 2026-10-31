export type ClaimViolationKind = "prohibited" | "requires_evidence";

export interface ClaimFlag {
  term: string;
  kind: ClaimViolationKind;
  message: string;
}

export interface ClaimEvaluationResult {
  compliant: boolean;
  needsReview: boolean;
  flags: ClaimFlag[];
}

export const PROHIBITED_TERMS: { pattern: RegExp; term: string; message: string }[] = [
  {
    pattern: /\b(menyembuhkan|mengobati|obat)\s+(kanker|diabetes|stroke|jantung|ginjal|asam urat)\b/i,
    term: "Klaim penyembuhan penyakit",
    message: "Klaim khasiat penyembuhan medis atau pengobatan penyakit pada produk kopi dilarang.",
  },
  {
    pattern: /\b(terapi\s+kanker|obat\s+alami\s+diabetes)\b/i,
    term: "Klaim terapi medis",
    message: "Kopi tidak boleh dipromosikan sebagai pengganti terapi atau obat medis resmi.",
  },
  {
    pattern: /\b(luwak\s+kandang|luwak\s+ternak)\b/i,
    term: "Kopi luwak kurung/ternak",
    message: "Biji Hub melarang penjualan kopi dari luwak kandang/ternak demi kesejahteraan satwa liar.",
  },
];

export const REQUIRES_EVIDENCE_TERMS: {
  pattern: RegExp;
  term: string;
  requiredBadge: string;
  message: string;
}[] = [
  {
    pattern: /\b(organik|certified\s+organic)\b/i,
    term: "organik",
    requiredBadge: "organic",
    message: "Klaim 'organik' memerlukan unggahan sertifikat organik resmi yang telah diverifikasi.",
  },
  {
    pattern: /\b(fair\s*trade|fairtrade)\b/i,
    term: "fair trade",
    requiredBadge: "fair_trade",
    message: "Klaim 'Fair Trade' memerlukan bukti sertifikasi Fair Trade yang sah.",
  },
  {
    pattern: /\b(indikasi\s+geografis|geographical\s+indication)\b/i,
    term: "indikasi geografis",
    requiredBadge: "gi",
    message: "Klaim sertifikasi Indikasi Geografis (IG) memerlukan dokumen verifikasi dari MPKG terkait.",
  },
  {
    pattern: /\b(kopi\s+luwak|luwak\s+liar)\b/i,
    term: "kopi luwak",
    requiredBadge: "wild_luwak",
    message: "Klaim kopi luwak liar wajib menyertakan verifikasi asal-usul panen liar bebas sangkar.",
  },
];

export function evaluateListingClaims(
  title: string,
  description: string,
  verifiedBadges: string[] = [],
): ClaimEvaluationResult {
  const combined = `${title} ${description}`.toLowerCase();
  const flags: ClaimFlag[] = [];
  const normalizedBadges = verifiedBadges.map((b) => b.toLowerCase());

  // 1. Prohibited claims check
  for (const item of PROHIBITED_TERMS) {
    if (item.pattern.test(combined)) {
      flags.push({
        term: item.term,
        kind: "prohibited",
        message: item.message,
      });
    }
  }

  // 2. Requires evidence check
  for (const item of REQUIRES_EVIDENCE_TERMS) {
    if (item.pattern.test(combined)) {
      const hasBadge = normalizedBadges.includes(item.requiredBadge);
      if (!hasBadge) {
        flags.push({
          term: item.term,
          kind: "requires_evidence",
          message: item.message,
        });
      }
    }
  }

  const compliant = flags.length === 0;
  const needsReview = flags.length > 0;

  return {
    compliant,
    needsReview,
    flags,
  };
}
