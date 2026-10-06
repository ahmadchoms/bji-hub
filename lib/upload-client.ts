import { createImageUploadAction } from "@/actions/upload.actions";
import {
  IMAGE_RULES,
  validateImageFile,
  validateRawImageFile,
  type UploadedImage,
} from "@/lib/storage";

const COMPRESS_ABOVE_BYTES = 800 * 1024;

async function prepare(file: File): Promise<File> {
  if (file.size <= COMPRESS_ABOVE_BYTES) return file;
  try {
    const { default: imageCompression } =
      await import("browser-image-compression");
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: file.type,
    });
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}

/**
 * The only function that knows how a file reaches storage.
 * With Supabase Storage, change the PUT below to `uploadToSignedUrl`; callers stay the same.
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const rawProblem = validateRawImageFile(file);
  if (rawProblem) throw new Error(rawProblem);

  const ready = await prepare(file);
  if (validateImageFile(ready))
    throw new Error(
      "Foto masih lebih dari 2 MB setelah dikompres. Pilih foto lain.",
    );

  const target = await createImageUploadAction({
    filename: file.name,
    contentType: ready.type,
    size: ready.size,
  });
  if (!target.success) throw new Error(target.error);

  const response = await fetch(target.data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": ready.type },
    body: ready,
  });
  if (!response.ok) throw new Error("Unggah gagal. Coba lagi.");

  return { url: target.data.publicUrl, path: target.data.path };
}
