import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compress: vi.fn(),
  action: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("browser-image-compression", () => ({ default: mocks.compress }));
vi.mock("@/actions/upload.actions", () => ({
  createImageUploadAction: mocks.action,
}));

import { uploadImage } from "@/lib/upload-client";

const MB = 1024 * 1024;
const file = (size: number, type = "image/jpeg") =>
  new File([new Uint8Array(size)], "foto.jpg", { type });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.action.mockImplementation(async (input: { size: number }) => ({
    success: true,
    data: {
      uploadUrl: "/api/mock-storage/x",
      publicUrl: "/api/mock-storage/x",
      path: `p/${input.size}`,
    },
  }));
  mocks.fetch.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", mocks.fetch);
});

describe("uploadImage", () => {
  it("compresses a 5 MB photo and uploads the smaller file", async () => {
    mocks.compress.mockResolvedValue(file(1 * MB));
    const result = await uploadImage(file(5 * MB));
    expect(mocks.compress).toHaveBeenCalledOnce();
    expect(mocks.action).toHaveBeenCalledWith(
      expect.objectContaining({ size: 1 * MB }),
    );
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/mock-storage/x",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(result).toEqual({ url: "/api/mock-storage/x", path: `p/${1 * MB}` });
  });

  it("explains the failure when the photo is still over 2 MB after compression", async () => {
    mocks.compress.mockResolvedValue(file(3 * MB));
    await expect(uploadImage(file(5 * MB))).rejects.toThrow(
      /setelah dikompres/,
    );
    expect(mocks.action).not.toHaveBeenCalled();
  });

  it("falls back to the original when compression throws and the original fits", async () => {
    mocks.compress.mockRejectedValue(new Error("worker failed"));
    await uploadImage(file(1.5 * MB));
    expect(mocks.action).toHaveBeenCalledWith(
      expect.objectContaining({ size: 1.5 * MB }),
    );
  });

  it("fails clearly when compression throws and the original is too big", async () => {
    mocks.compress.mockRejectedValue(new Error("worker failed"));
    await expect(uploadImage(file(4 * MB))).rejects.toThrow(
      /setelah dikompres/,
    );
  });

  it("skips compression for small photos", async () => {
    await uploadImage(file(500 * 1024));
    expect(mocks.compress).not.toHaveBeenCalled();
  });

  it("rejects files over 15 MB and wrong types before doing any work", async () => {
    await expect(uploadImage(file(16 * MB))).rejects.toThrow(/15 MB/);
    await expect(uploadImage(file(MB, "image/gif"))).rejects.toThrow(/Format/);
    expect(mocks.compress).not.toHaveBeenCalled();
    expect(mocks.action).not.toHaveBeenCalled();
  });

  it("surfaces server and network failures", async () => {
    mocks.action.mockResolvedValueOnce({
      success: false,
      error: "File tidak dapat diunggah",
    });
    await expect(uploadImage(file(MB))).rejects.toThrow(
      "File tidak dapat diunggah",
    );
    mocks.fetch.mockResolvedValueOnce({ ok: false });
    await expect(uploadImage(file(MB))).rejects.toThrow(/Unggah gagal/);
  });
});
