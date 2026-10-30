import { getPool } from "@/lib/db/pool";
import { assertMockAllowed } from "@/lib/data/mock-guard";
import { logger } from "@/lib/logger";
import type { Producer, ProducerKind } from "@/types";

export const mockProducers: Producer[] = [
  {
    id: "prod-gayo-kbqb",
    slug: "koperasi-baburrayyan-gayo",
    name: "Koperasi Baitul Qiradh Baburrayyan (KBQB)",
    kind: "koperasi",
    originId: "origin-gayo",
    village: "Takengon, Aceh Tengah",
    province: "Aceh",
    altitudeMin: 1300,
    altitudeMax: 1700,
    farmersCount: 5400,
    story: "Koperasi petani kopi organik tertua dan terbesar di dataran tinggi Gayo yang menaungi ribuan pekebun skala kecil. Mengusung praktik agroforestri berkelanjutan di bawah naungan pohon gamal dan pinus.",
    certifications: ["indikasi-geografis", "organik-indonesia", "fair-trade"],
    claimsVerifiedAt: "2025-06-15T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "prod-toraja-sapan",
    slug: "kolektif-tani-sapan-toraja",
    name: "Kolektif Petani Sapan Toraja",
    kind: "petani",
    originId: "origin-toraja",
    village: "Sapan, Buntu Pepasan, Toraja Utara",
    province: "Sulawesi Selatan",
    altitudeMin: 1600,
    altitudeMax: 2000,
    farmersCount: 85,
    story: "Komunitas petani pegunungan Sapan yang membudidayakan varietas warisan S795 di lembah berkabut tinggi. Panen petik merah manual menghasilkan karakter rasa yang sangat bersih, manis karamel, dan rempah halus.",
    certifications: ["indikasi-geografis"],
    claimsVerifiedAt: "2025-08-10T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "prod-preanger-kencana",
    slug: "koperasi-kencana-preanger",
    name: "Koperasi Gunung Kencana Preanger",
    kind: "koperasi",
    originId: "origin-preanger",
    village: "Pangalengan, Bandung Selatan",
    province: "Jawa Barat",
    altitudeMin: 1350,
    altitudeMax: 1650,
    farmersCount: 230,
    story: "Meneruskan legenda 'A Cup of Java' dari lereng pegunungan Malabar dan Wayang Windu. Fokus pada fermentasi washed presisi dan honeys alami dengan profil aroma floral melati yang lembut.",
    certifications: ["indikasi-geografis", "rainforest-alliance"],
    claimsVerifiedAt: "2025-07-22T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-02-01T00:00:00.000Z",
  },
  {
    id: "prod-kintamani-subak",
    slug: "subak-abian-manik-segara",
    name: "Subak Abian Manik Segara",
    kind: "koperasi",
    originId: "origin-kintamani",
    village: "Kintamani, Bangli",
    province: "Bali",
    altitudeMin: 1200,
    altitudeMax: 1550,
    farmersCount: 160,
    story: "Kelompok tani adat berlandaskan filosofi Tri Hita Karana. Pohon kopi ditanam berdampingan dengan jeruk kintamani dalam sistem tumpang sari tradisional, memberikan keasaman citrus jeruk segar alami.",
    certifications: ["indikasi-geografis", "organik-indonesia"],
    claimsVerifiedAt: "2025-09-05T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-02-15T00:00:00.000Z",
  },
  {
    id: "prod-flores-asnikom",
    slug: "koperasi-asnikom-bajawa",
    name: "Koperasi ASNIKOM Bajawa",
    kind: "koperasi",
    originId: "origin-bajawa",
    village: "Bajawa, Ngada",
    province: "Nusa Tenggara Timur",
    altitudeMin: 1250,
    altitudeMax: 1600,
    farmersCount: 420,
    story: "Asosiasi Petani Kopi Ngada yang mengelola kebun kopi di kaki Gunung Inerie pada tanah andosol vulkanik subur. Kopi Bajawa terkenal dengan aroma nutty, body tebal, dan cokelat manis seimbang.",
    certifications: ["indikasi-geografis", "fair-trade"],
    claimsVerifiedAt: "2025-08-30T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-03-01T00:00:00.000Z",
  },
  {
    id: "prod-wamena-baliem",
    slug: "kelompok-tani-lembah-baliem",
    name: "Kelompok Tani Lembah Baliem",
    kind: "petani",
    originId: "origin-wamena",
    village: "Lembah Baliem, Jayawijaya",
    province: "Papua",
    altitudeMin: 1650,
    altitudeMax: 2100,
    farmersCount: 75,
    story: "Budidaya kopi dataran tinggi alami di Lembah Baliem tanpa pestisida atau pupuk sintetis apa pun sejak generasi terdahulu. Menghasilkan cita rasa clean cup dengan aroma floral liar dan sweet cocoa finish.",
    certifications: ["organik-indonesia"],
    claimsVerifiedAt: "2025-10-01T00:00:00.000Z",
    photoUrls: [
      "https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?auto=format&fit=crop&w=800&q=80",
    ],
    createdAt: "2025-03-15T00:00:00.000Z",
  },
];

export async function getProducers(options?: {
  originId?: string;
  kind?: string;
  verifiedOnly?: boolean;
}): Promise<Producer[]> {
  const pool = getPool();
  if (pool) {
    try {
      let query = `
        SELECT id, slug, name, kind, origin_id, village, province,
               altitude_min, altitude_max, farmers_count, story,
               certifications, claims_verified_at, photo_urls, created_at
        FROM public.producers
        WHERE 1=1
      `;
      const params: (string | boolean | number)[] = [];

      if (options?.originId) {
        params.push(options.originId);
        query += ` AND origin_id = $${params.length}`;
      }
      if (options?.kind) {
        params.push(options.kind);
        query += ` AND kind = $${params.length}`;
      }
      if (options?.verifiedOnly) {
        query += ` AND claims_verified_at IS NOT NULL`;
      }

      query += ` ORDER BY name ASC`;
      const res = await pool.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        kind: r.kind as ProducerKind,
        originId: r.origin_id || null,
        village: r.village || null,
        province: r.province || null,
        altitudeMin: r.altitude_min ?? null,
        altitudeMax: r.altitude_max ?? null,
        farmersCount: r.farmers_count ?? null,
        story: r.story || null,
        certifications: r.certifications || [],
        claimsVerifiedAt: r.claims_verified_at
          ? new Date(r.claims_verified_at).toISOString()
          : null,
        photoUrls: r.photo_urls || [],
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch (err) {
      assertMockAllowed("getProducers");
      logger.warn("producers.query_failed", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getProducers:no_pool");
  }

  let list = [...mockProducers];
  if (options?.originId) {
    list = list.filter((p) => p.originId === options.originId);
  }
  if (options?.kind) {
    list = list.filter((p) => p.kind === options.kind);
  }
  if (options?.verifiedOnly) {
    list = list.filter((p) => Boolean(p.claimsVerifiedAt));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProducerBySlug(slug: string): Promise<Producer | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, slug, name, kind, origin_id, village, province,
                altitude_min, altitude_max, farmers_count, story,
                certifications, claims_verified_at, photo_urls, created_at
         FROM public.producers WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          kind: r.kind as ProducerKind,
          originId: r.origin_id || null,
          village: r.village || null,
          province: r.province || null,
          altitudeMin: r.altitude_min ?? null,
          altitudeMax: r.altitude_max ?? null,
          farmersCount: r.farmers_count ?? null,
          story: r.story || null,
          certifications: r.certifications || [],
          claimsVerifiedAt: r.claims_verified_at
            ? new Date(r.claims_verified_at).toISOString()
            : null,
          photoUrls: r.photo_urls || [],
          createdAt: new Date(r.created_at).toISOString(),
        };
      }
      return null;
    } catch (err) {
      assertMockAllowed("getProducerBySlug");
      logger.warn("producers.query_by_slug_failed", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getProducerBySlug:no_pool");
  }

  return mockProducers.find((p) => p.slug === slug) || null;
}

export async function getProducerById(id: string): Promise<Producer | null> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, slug, name, kind, origin_id, village, province,
                altitude_min, altitude_max, farmers_count, story,
                certifications, claims_verified_at, photo_urls, created_at
         FROM public.producers WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          slug: r.slug,
          name: r.name,
          kind: r.kind as ProducerKind,
          originId: r.origin_id || null,
          village: r.village || null,
          province: r.province || null,
          altitudeMin: r.altitude_min ?? null,
          altitudeMax: r.altitude_max ?? null,
          farmersCount: r.farmers_count ?? null,
          story: r.story || null,
          certifications: r.certifications || [],
          claimsVerifiedAt: r.claims_verified_at
            ? new Date(r.claims_verified_at).toISOString()
            : null,
          photoUrls: r.photo_urls || [],
          createdAt: new Date(r.created_at).toISOString(),
        };
      }
      return null;
    } catch (err) {
      assertMockAllowed("getProducerById");
      logger.warn("producers.query_by_id_failed", { error: (err as Error).message });
    }
  } else {
    assertMockAllowed("getProducerById:no_pool");
  }

  return mockProducers.find((p) => p.id === id) || null;
}

export async function createProducer(data: {
  name: string;
  kind: ProducerKind;
  originId?: string | null;
  village?: string | null;
  province?: string | null;
  altitudeMin?: number | null;
  altitudeMax?: number | null;
  farmersCount?: number | null;
  story?: string | null;
  certifications?: string[];
  photoUrls?: string[];
}): Promise<Producer> {
  const baseSlug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const pool = getPool();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.producers (
        name, slug, kind, origin_id, village, province,
        altitude_min, altitude_max, farmers_count, story,
        certifications, photo_urls, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, slug, name, kind, origin_id, village, province,
                altitude_min, altitude_max, farmers_count, story,
                certifications, claims_verified_at, photo_urls, created_at`,
      [
        data.name,
        slug,
        data.kind,
        data.originId || null,
        data.village || null,
        data.province || null,
        data.altitudeMin ?? null,
        data.altitudeMax ?? null,
        data.farmersCount ?? null,
        data.story || null,
        data.certifications || [],
        data.photoUrls || [],
      ]
    );
    const r = res.rows[0];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      kind: r.kind as ProducerKind,
      originId: r.origin_id || null,
      village: r.village || null,
      province: r.province || null,
      altitudeMin: r.altitude_min ?? null,
      altitudeMax: r.altitude_max ?? null,
      farmersCount: r.farmers_count ?? null,
      story: r.story || null,
      certifications: r.certifications || [],
      claimsVerifiedAt: r.claims_verified_at ? new Date(r.claims_verified_at).toISOString() : null,
      photoUrls: r.photo_urls || [],
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  assertMockAllowed("createProducer:no_pool");
  const newMock: Producer = {
    id: `prod-${Date.now()}`,
    slug,
    name: data.name,
    kind: data.kind,
    originId: data.originId || null,
    village: data.village || null,
    province: data.province || null,
    altitudeMin: data.altitudeMin ?? null,
    altitudeMax: data.altitudeMax ?? null,
    farmersCount: data.farmersCount ?? null,
    story: data.story || null,
    certifications: data.certifications || [],
    claimsVerifiedAt: null,
    photoUrls: data.photoUrls || [],
    createdAt: new Date().toISOString(),
  };
  mockProducers.push(newMock);
  return newMock;
}

export async function verifyProducerClaims(id: string): Promise<Producer | null> {
  const pool = getPool();
  if (pool) {
    const res = await pool.query(
      `UPDATE public.producers
       SET claims_verified_at = NOW()
       WHERE id = $1
       RETURNING id, slug, name, kind, origin_id, village, province,
                 altitude_min, altitude_max, farmers_count, story,
                 certifications, claims_verified_at, photo_urls, created_at`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      kind: r.kind as ProducerKind,
      originId: r.origin_id || null,
      village: r.village || null,
      province: r.province || null,
      altitudeMin: r.altitude_min ?? null,
      altitudeMax: r.altitude_max ?? null,
      farmersCount: r.farmers_count ?? null,
      story: r.story || null,
      certifications: r.certifications || [],
      claimsVerifiedAt: r.claims_verified_at ? new Date(r.claims_verified_at).toISOString() : null,
      photoUrls: r.photo_urls || [],
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  assertMockAllowed("verifyProducerClaims:no_pool");
  const p = mockProducers.find((item) => item.id === id);
  if (p) {
    p.claimsVerifiedAt = new Date().toISOString();
    return p;
  }
  return null;
}
