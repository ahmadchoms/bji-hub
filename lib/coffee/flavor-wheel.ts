export interface FlavorCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  tags: Array<{
    id: string;
    name: string;
    keywords: string[];
  }>;
}

export const FLAVOR_WHEEL_CATEGORIES: FlavorCategory[] = [
  {
    id: "buah",
    name: "Buah",
    description: "Cita rasa buah segar, asam cerah, dan manis alami.",
    color: "#E05A47",
    tags: [
      { id: "jeruk", name: "Jeruk / Sitrus", keywords: ["jeruk", "citrus", "orange", "lemon", "lime", "tangerine"] },
      { id: "apel", name: "Apel", keywords: ["apel", "apple", "green apple", "red apple"] },
      { id: "berry", name: "Berry", keywords: ["berry", "strawberry", "blueberry", "blackberry", "raspberry", "stroberi"] },
      { id: "buah-batu", name: "Buah Batu (Persik/Plum)", keywords: ["peach", "plum", "persik", "aprikot", "cherry", "ceri"] },
      { id: "tropis", name: "Tropis (Mangga/Nanas)", keywords: ["mango", "pineapple", "mangga", "nanas", "passion fruit", "markisa"] },
      { id: "nangka", name: "Nangka", keywords: ["nangka", "jackfruit"] },
      { id: "anggur", name: "Anggur", keywords: ["grape", "red grape", "anggur", "raisin", "kismis"] },
    ],
  },
  {
    id: "bunga",
    name: "Bunga",
    description: "Aroma wangi bunga yang harum, anggun, dan lembut.",
    color: "#C25992",
    tags: [
      { id: "melati", name: "Melati (Jasmine)", keywords: ["melati", "jasmine"] },
      { id: "bergamot", name: "Bergamot / Earl Grey", keywords: ["bergamot", "earl grey"] },
      { id: "mawar", name: "Mawar (Rose)", keywords: ["mawar", "rose"] },
      { id: "chamomile", name: "Chamomile", keywords: ["chamomile", "kamomil"] },
      { id: "floral", name: "Floral", keywords: ["floral", "bunga"] },
    ],
  },
  {
    id: "manis",
    name: "Manis",
    description: "Kemanisan mendalam dari karamel, madu, dan gula alami.",
    color: "#D97706",
    tags: [
      { id: "karamel", name: "Karamel", keywords: ["karamel", "caramel", "toffee", "butterscotch"] },
      { id: "madu", name: "Madu", keywords: ["madu", "honey"] },
      { id: "gula-aren", name: "Gula Aren / Palm Sugar", keywords: ["gula aren", "palm sugar", "brown sugar", "molasses"] },
      { id: "vanila", name: "Vanila", keywords: ["vanilla", "vanila"] },
    ],
  },
  {
    id: "kacang_kakao",
    name: "Kacang & Kakao",
    description: "Nuansa cokelat kaya rasa dan kelembutan aneka kacang.",
    color: "#78350F",
    tags: [
      { id: "cokelat", name: "Cokelat Hitam (Dark Chocolate)", keywords: ["dark chocolate", "cocoa", "cokelat", "chocolate", "cacao"] },
      { id: "cokelat-susu", name: "Cokelat Susu (Milk Chocolate)", keywords: ["milk chocolate", "creamy chocolate"] },
      { id: "hazelnut", name: "Hazelnut", keywords: ["hazelnut"] },
      { id: "almond", name: "Almond", keywords: ["almond"] },
      { id: "kacang", name: "Nutty / Kacang", keywords: ["nutty", "peanut", "kacang", "walnut"] },
    ],
  },
  {
    id: "rempah",
    name: "Rempah",
    description: "Kehangatan rempah alami khas kepulauan Nusantara.",
    color: "#B45309",
    tags: [
      { id: "kayu-manis", name: "Kayu Manis", keywords: ["kayu manis", "cinnamon"] },
      { id: "cengkeh", name: "Cengkeh", keywords: ["cengkeh", "clove"] },
      { id: "jahe", name: "Jahe", keywords: ["jahe", "ginger"] },
      { id: "kapulaga", name: "Kapulaga / Cardamom", keywords: ["kapulaga", "cardamom"] },
      { id: "pala", name: "Pala (Nutmeg)", keywords: ["pala", "nutmeg"] },
      { id: "rempah-hangat", name: "Spices / Rempah", keywords: ["spice", "spices", "rempah"] },
    ],
  },
  {
    id: "panggang",
    name: "Panggang",
    description: "Karakter renyah biskuit, sereal, dan biji-bijian terpanggang.",
    color: "#854D0E",
    tags: [
      { id: "biskuit", name: "Biskuit / Malt", keywords: ["biscuit", "biskuit", "malt", "cookie"] },
      { id: "roti-panggang", name: "Roti Panggang (Toast)", keywords: ["toast", "roti panggang", "cereal", "sereal"] },
    ],
  },
  {
    id: "herbal_kayu",
    name: "Herbal & Kayu",
    description: "Karakter earthy, tembakau manis, dan kesegaran daun herbal.",
    color: "#3F6212",
    tags: [
      { id: "teh-hitam", name: "Teh Hitam (Black Tea)", keywords: ["black tea", "teh hitam", "tea", "teh"] },
      { id: "tembakau", name: "Tembakau Manis", keywords: ["tobacco", "tembakau"] },
      { id: "cedar", name: "Kayu Cedar / Woody", keywords: ["cedar", "woody", "kayu"] },
      { id: "herbal", name: "Herbal / Earthy", keywords: ["herbal", "earthy", "lemongrass", "serai", "pandan"] },
    ],
  },
];

/**
 * Normalizes free text flavor notes into standard flavor taxonomy tags.
 * Preserves unrecognized terms as lowercase clean tags.
 */
export function extractFlavorTags(flavorNotes?: string | null): string[] {
  if (!flavorNotes || !flavorNotes.trim()) return [];

  const tokens = flavorNotes
    .toLowerCase()
    .split(/[,•|;/]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const matchedTagIds = new Set<string>();

  for (const token of tokens) {
    let matched = false;
    for (const cat of FLAVOR_WHEEL_CATEGORIES) {
      for (const tag of cat.tags) {
        if (tag.keywords.some((k) => token.includes(k) || k.includes(token))) {
          matchedTagIds.add(tag.id);
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched && token.length >= 3) {
      // Keep cleaned token as fallback tag
      const fallback = token.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (fallback) matchedTagIds.add(fallback);
    }
  }

  return Array.from(matchedTagIds);
}

/**
 * Returns human-readable label for a flavor tag id.
 */
export function getFlavorTagLabel(tagId: string): string {
  for (const cat of FLAVOR_WHEEL_CATEGORIES) {
    for (const tag of cat.tags) {
      if (tag.id === tagId) return tag.name;
    }
  }
  return tagId.replace(/-/g, " ");
}

/**
 * Returns parent category for a flavor tag id.
 */
export function getFlavorTagCategory(tagId: string): FlavorCategory | null {
  for (const cat of FLAVOR_WHEEL_CATEGORIES) {
    if (cat.tags.some((t) => t.id === tagId)) return cat;
  }
  return null;
}
