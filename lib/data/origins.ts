import type { Pool } from "pg";
import { getPool } from "@/lib/db/pool";
import type { CoffeeOrigin } from "@/types";

// In-memory mock storage pre-populated with popular domestic & international specialty origins
const mockOrigins: CoffeeOrigin[] = [
  {
    id: "origin-gayo",
    name: "Aceh Gayo",
    country: "Indonesia",
    islandOrState: "Sumatra",
    minAltitude: 1200,
    maxAltitude: 1700,
    description: "Karakter acidity jernih, body tebal, aroma rempah dan herbal manis khas dataran tinggi Gayo.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-mandheling",
    name: "Mandheling",
    country: "Indonesia",
    islandOrState: "Sumatra",
    minAltitude: 1000,
    maxAltitude: 1500,
    description: "Kopi legendaris dengan metode giling basah (wet-hulled), earthy, syrupy body, dan hint tembakau manis.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-preanger",
    name: "Java Preanger",
    country: "Indonesia",
    islandOrState: "Jawa Barat",
    minAltitude: 1200,
    maxAltitude: 1650,
    description: "Aroma melati floral, acidity citrus lembut, dan aftertaste manis madu alami.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-toraja",
    name: "Toraja Sapan",
    country: "Indonesia",
    islandOrState: "Sulawesi",
    minAltitude: 1400,
    maxAltitude: 1900,
    description: "Karakter clean cup, acidity apel hijau, caramel sweetness, dan sentuhan rempah lembut.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-kintamani",
    name: "Kintamani",
    country: "Indonesia",
    islandOrState: "Bali",
    minAltitude: 1100,
    maxAltitude: 1500,
    description: "Tumbuh berdampingan dengan jeruk kintamani, menghasilkan brightness citrus jeruk segar dan floral.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-bajawa",
    name: "Flores Bajawa",
    country: "Indonesia",
    islandOrState: "Nusa Tenggara Timur",
    minAltitude: 1200,
    maxAltitude: 1600,
    description: "Tanah vulkanik subur memberi aroma cokelat gelap karamel, nutty, dan keasaman seimbang.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-wamena",
    name: "Wamena",
    country: "Indonesia",
    islandOrState: "Papua",
    minAltitude: 1600,
    maxAltitude: 2000,
    description: "Kopi organik lembah Baliem, medium body, aroma floral, dan aftertaste cokelat lembut.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-yirgacheffe",
    name: "Yirgacheffe",
    country: "Ethiopia",
    islandOrState: "Gedeo Zone",
    minAltitude: 1750,
    maxAltitude: 2200,
    description: "Benchmark kopi spesialti dunia, aroma melati, bergamot, peach, dan black tea yang sangat anggun.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-huila",
    name: "Huila",
    country: "Colombia",
    islandOrState: "Andes",
    minAltitude: 1300,
    maxAltitude: 1950,
    description: "Bright malic acidity, red berries, panela (gula tebu), dan keseimbangan cup yang konsisten.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-antigua",
    name: "Antigua",
    country: "Guatemala",
    islandOrState: "Sacatepéquez",
    minAltitude: 1500,
    maxAltitude: 1800,
    description: "Kawasan diapit 3 gunung berapi aktif, notes cokelat susu, keasaman plum manis, dan aroma rempah.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-tarrazu",
    name: "Tarrazú",
    country: "Costa Rica",
    islandOrState: "San José",
    minAltitude: 1300,
    maxAltitude: 1900,
    description: "Karakter crisp acidity, body ringan lembut, aroma madu bunga jeruk, dan finish yang bersih.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "origin-nyeri",
    name: "Nyeri",
    country: "Kenya",
    islandOrState: "Central Highlands",
    minAltitude: 1700,
    maxAltitude: 2100,
    description: "Acidity phosphoric intens, blackcurrant, blackberry, dan rasa manis kompleks yang pekat.",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

let isTableInitialized = false;
async function ensureOriginsTable(pool: Pool) {
  if (isTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.coffee_origins (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        country TEXT NOT NULL,
        island_or_state TEXT,
        min_altitude INTEGER,
        max_altitude INTEGER,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_coffee_origins_country ON public.coffee_origins(country);
    `);

    // Check if empty, if so seed default origins
    const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM public.coffee_origins`);
    if (countRes.rows[0]?.count === 0) {
      for (const orig of mockOrigins) {
        await pool.query(
          `INSERT INTO public.coffee_origins (id, name, country, island_or_state, min_altitude, max_altitude, description, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
           ON CONFLICT (name) DO NOTHING`,
          [
            orig.id,
            orig.name,
            orig.country,
            orig.islandOrState || null,
            orig.minAltitude || null,
            orig.maxAltitude || null,
            orig.description || null,
            orig.isActive,
            orig.createdAt,
          ]
        );
      }
    }
    isTableInitialized = true;
  } catch (err) {
    console.warn("Could not auto-initialize coffee_origins table:", err);
  }
}

export async function getCoffeeOrigins(options?: {
  activeOnly?: boolean;
  country?: string;
  search?: string;
}): Promise<CoffeeOrigin[]> {
  const pool = getPool();
  if (pool) {
    try {
      await ensureOriginsTable(pool);
      let query = `SELECT id, name, country, island_or_state, min_altitude, max_altitude, description, is_active, created_at FROM public.coffee_origins WHERE 1=1`;
      const params: (string | boolean | number)[] = [];

      if (options?.activeOnly) {
        params.push(true);
        query += ` AND is_active = $${params.length}`;
      }
      if (options?.country) {
        params.push(options.country);
        query += ` AND country = $${params.length}`;
      }
      if (options?.search) {
        params.push(`%${options.search.toLowerCase()}%`);
        query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(country) LIKE $${params.length} OR LOWER(COALESCE(island_or_state, '')) LIKE $${params.length})`;
      }

      query += ` ORDER BY country ASC, name ASC`;
      const res = await pool.query(query, params);
      return res.rows.map((r) => ({
        id: r.id,
        name: r.name,
        country: r.country,
        islandOrState: r.island_or_state || undefined,
        minAltitude: r.min_altitude ?? undefined,
        maxAltitude: r.max_altitude ?? undefined,
        description: r.description || undefined,
        isActive: Boolean(r.is_active),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch {
      // ignore: coffee origins db query fallback to mock store in dev
      // Fallback to mock
    }
  }

  let list = [...mockOrigins];
  if (options?.activeOnly) {
    list = list.filter((o) => o.isActive);
  }
  if (options?.country) {
    list = list.filter((o) => o.country.toLowerCase() === options.country!.toLowerCase());
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q) ||
        (o.islandOrState && o.islandOrState.toLowerCase().includes(q))
    );
  }
  return list.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
}

export function toOriginSlug(origin: { id: string; name: string }): string {
  if (origin.id.startsWith("origin-")) {
    return origin.id.replace("origin-", "");
  }
  return origin.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCoffeeOriginBySlug(slug: string): Promise<CoffeeOrigin | null> {
  const all = await getCoffeeOrigins();
  const normalized = slug.toLowerCase().trim();
  return (
    all.find(
      (o) =>
        o.id === normalized ||
        o.id === `origin-${normalized}` ||
        toOriginSlug(o) === normalized ||
        o.name.toLowerCase().trim() === normalized
    ) || null
  );
}

export async function getCoffeeOriginById(id: string): Promise<CoffeeOrigin | null> {
  const pool = getPool();
  if (pool) {
    try {
      await ensureOriginsTable(pool);
      const res = await pool.query(
        `SELECT id, name, country, island_or_state, min_altitude, max_altitude, description, is_active, created_at
         FROM public.coffee_origins WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          country: r.country,
          islandOrState: r.island_or_state || undefined,
          minAltitude: r.min_altitude ?? undefined,
          maxAltitude: r.max_altitude ?? undefined,
          description: r.description || undefined,
          isActive: Boolean(r.is_active),
          createdAt: new Date(r.created_at).toISOString(),
        };
      }
    } catch {
      // ignore: coffee origins db query fallback to mock store in dev
      // Fallback
    }
  }
  return mockOrigins.find((o) => o.id === id) || null;
}

export async function createCoffeeOrigin(data: {
  name: string;
  country: string;
  islandOrState?: string;
  minAltitude?: number;
  maxAltitude?: number;
  description?: string;
}): Promise<CoffeeOrigin> {
  const newOrigin: CoffeeOrigin = {
    id: `origin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    country: data.country.trim(),
    islandOrState: data.islandOrState?.trim() || undefined,
    minAltitude: data.minAltitude,
    maxAltitude: data.maxAltitude,
    description: data.description?.trim() || undefined,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  mockOrigins.push(newOrigin);

  const pool = getPool();
  if (pool) {
    try {
      await ensureOriginsTable(pool);
      await pool.query(
        `INSERT INTO public.coffee_origins (id, name, country, island_or_state, min_altitude, max_altitude, description, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          newOrigin.id,
          newOrigin.name,
          newOrigin.country,
          newOrigin.islandOrState || null,
          newOrigin.minAltitude || null,
          newOrigin.maxAltitude || null,
          newOrigin.description || null,
          newOrigin.isActive,
        ]
      );
    } catch {
      // ignore: coffee origins db query fallback to mock store in dev
      // Fallback
    }
  }

  return newOrigin;
}

export async function updateCoffeeOrigin(
  id: string,
  data: Partial<Omit<CoffeeOrigin, "id" | "createdAt">>
): Promise<CoffeeOrigin | null> {
  const idx = mockOrigins.findIndex((o) => o.id === id);
  if (idx !== -1) {
    mockOrigins[idx] = { ...mockOrigins[idx], ...data };
  }

  const pool = getPool();
  if (pool) {
    try {
      await ensureOriginsTable(pool);
      const existing = await getCoffeeOriginById(id);
      if (existing) {
        const merged = { ...existing, ...data };
        await pool.query(
          `UPDATE public.coffee_origins
           SET name = $1, country = $2, island_or_state = $3, min_altitude = $4, max_altitude = $5, description = $6, is_active = $7, updated_at = NOW()
           WHERE id = $8`,
          [
            merged.name,
            merged.country,
            merged.islandOrState || null,
            merged.minAltitude || null,
            merged.maxAltitude || null,
            merged.description || null,
            merged.isActive,
            id,
          ]
        );
        return merged;
      }
    } catch {
      // ignore: coffee origins db query fallback to mock store in dev
      // Fallback
    }
  }

  return idx !== -1 ? mockOrigins[idx] : null;
}

export async function toggleCoffeeOriginStatus(id: string): Promise<CoffeeOrigin | null> {
  const current = await getCoffeeOriginById(id);
  if (!current) return null;
  return updateCoffeeOrigin(id, { isActive: !current.isActive });
}
