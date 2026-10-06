export const IMAGE_RULES = {
  maxBytes: 2 * 1024 * 1024,
  maxCount: 5,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;

export type ImageType = (typeof IMAGE_RULES.types)[number];

export function validateRawImageFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!isAllowedImageType(file.type)) return "Format harus JPG, PNG, atau WebP";
  if (file.size <= 0) return "File kosong";
  if (file.size > MAX_RAW_IMAGE_BYTES)
    return `Ukuran maksimal ${MAX_RAW_IMAGE_BYTES / 1024 / 1024} MB`;
  return null;
}

export function partitionImageFiles<
  T extends { name: string; type: string; size: number },
>(
  files: readonly T[],
  slotsLeft: number,
): { accepted: T[]; rejected: string[] } {
  const accepted: T[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    const problem = validateRawImageFile(file);
    if (problem) rejected.push(`${file.name}: ${problem}`);
    else if (accepted.length < slotsLeft) accepted.push(file);
    else
      rejected.push(
        `${file.name}: melebihi batas ${IMAGE_RULES.maxCount} foto`,
      );
  }
  return { accepted, rejected };
}

/** Swap for the real public bucket URL prefix when Supabase Storage is connected. */
export const OWNED_IMAGE_URL_PREFIX = "/api/mock-storage/";

export interface UploadedImage {
  url: string;
  path: string;
}

export function isAllowedImageType(type: string): type is ImageType {
  return (IMAGE_RULES.types as readonly string[]).includes(type);
}

export function validateImageFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!isAllowedImageType(file.type)) return "Format harus JPG, PNG, atau WebP";
  if (file.size <= 0) return "File kosong";
  if (file.size > IMAGE_RULES.maxBytes)
    return `Ukuran maksimal ${IMAGE_RULES.maxBytes / 1024 / 1024} MB`;
  return null;
}

/** Real type from the file signature, so a spoofed Content-Type cannot slip through. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function isOwnedImageUrl(url: string): boolean {
  return (
    url.startsWith(OWNED_IMAGE_URL_PREFIX) &&
    !url.includes("..") &&
    !url.includes("?")
  );
}

/** Every image must come from our storage, or already belong to the listing being edited. */
export function findInvalidImageUrl(
  images: readonly UploadedImage[],
  existingUrls: ReadonlySet<string> = new Set(),
): string | null {
  for (const image of images) {
    if (!isOwnedImageUrl(image.url) && !existingUrls.has(image.url))
      return image.url;
  }
  return null;
}
