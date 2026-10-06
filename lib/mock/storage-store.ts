import {
  IMAGE_RULES,
  detectImageType,
  isAllowedImageType,
  OWNED_IMAGE_URL_PREFIX,
} from "@/lib/storage";

const TARGET_TTL_MS = 10 * 60_000;
const MAX_FILES = 100;

interface PendingTarget {
  sellerId: string;
  contentType: string;
  maxBytes: number;
  expiresAt: number;
}

interface StoredFile {
  bytes: Uint8Array;
  contentType: string;
}

interface StorageStore {
  pending: Map<string, PendingTarget>;
  files: Map<string, StoredFile>;
}

const globalRef = globalThis as unknown as { __bijiStorage?: StorageStore };
const store: StorageStore = (globalRef.__bijiStorage ??= {
  pending: new Map(),
  files: new Map(),
});

export interface UploadTarget {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

export function createImageUploadTarget(
  input: { sellerId: string; contentType: string; size: number },
  now: number = Date.now(),
): UploadTarget | null {
  if (
    !isAllowedImageType(input.contentType) ||
    input.size <= 0 ||
    input.size > IMAGE_RULES.maxBytes
  )
    return null;

  const id = crypto.randomUUID();
  store.pending.set(id, {
    sellerId: input.sellerId,
    contentType: input.contentType,
    maxBytes: IMAGE_RULES.maxBytes,
    expiresAt: now + TARGET_TTL_MS,
  });
  const url = `${OWNED_IMAGE_URL_PREFIX}${id}`;
  return {
    uploadUrl: url,
    publicUrl: url,
    path: `listings/${input.sellerId}/${id}`,
  };
}

export type StoreUploadResult =
  | "stored"
  | "not_found"
  | "forbidden"
  | "expired"
  | "too_large"
  | "invalid_type";

/** A target is single-use and expires, like a signed upload URL. */
export function storeUploadedImage(
  input: { id: string; sellerId: string; bytes: Uint8Array },
  now: number = Date.now(),
): StoreUploadResult {
  const target = store.pending.get(input.id);
  if (!target) return "not_found";
  if (target.sellerId !== input.sellerId) return "forbidden";
  if (now > target.expiresAt) {
    store.pending.delete(input.id);
    return "expired";
  }
  if (input.bytes.length === 0 || input.bytes.length > target.maxBytes)
    return "too_large";
  if (detectImageType(input.bytes) !== target.contentType)
    return "invalid_type";

  store.pending.delete(input.id);
  store.files.set(input.id, {
    bytes: input.bytes,
    contentType: target.contentType,
  });
  if (store.files.size > MAX_FILES) {
    const oldest = store.files.keys().next().value;
    if (oldest) store.files.delete(oldest);
  }
  return "stored";
}

export function readStoredImage(id: string): StoredFile | null {
  return store.files.get(id) ?? null;
}

export function resetStorageStore(): void {
  store.pending.clear();
  store.files.clear();
}
