import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readStoredImage, storeUploadedImage } from "@/lib/data";
import { IMAGE_RULES } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const STATUS = {
  not_found: 404,
  forbidden: 403,
  expired: 410,
  too_large: 413,
  invalid_type: 415,
} as const;

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSession();
  if (session.role !== "seller" || !session.sellerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > IMAGE_RULES.maxBytes) {
    return NextResponse.json({ error: "File terlalu besar" }, { status: 413 });
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  const result = storeUploadedImage({ id, sellerId: session.sellerId, bytes });
  if (result !== "stored") {
    return NextResponse.json({ error: result }, { status: STATUS[result] });
  }
  return new NextResponse(null, { status: 204 });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const file = readStoredImage(id);
  if (!file) return new NextResponse(null, { status: 404 });

  return new NextResponse(file.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
