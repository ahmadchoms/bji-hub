import { NextRequest, NextResponse } from "next/server";
import { trackPayloadSchema } from "@/lib/validations/track.schema";
import { recordTrackEvent } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless/i;

export async function POST(req: NextRequest) {
  if (BOT_PATTERN.test(req.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
  const rl = checkRateLimit(`ip_track:${clientIp}`, 120, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = trackPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await recordTrackEvent(parsed.data);
  if (result === "rate_limited") {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return new NextResponse(null, { status: 204 });
}
