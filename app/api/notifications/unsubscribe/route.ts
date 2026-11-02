import { NextRequest, NextResponse } from "next/server";
import {
  verifyUnsubscribeToken,
  updateUserNotificationPrefs,
} from "@/lib/coffee/reminders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const token = url.searchParams.get("token");

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tautan Tidak Valid - Biji Hub</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; max-width: 440px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 18px; margin: 0 0 8px; color: #dc2626; }
    p { font-size: 14px; color: #57534e; line-height: 1.5; margin: 0 0 20px; }
    a { display: inline-block; font-size: 14px; font-weight: 500; color: #78350f; text-decoration: none; padding: 8px 16px; border: 1px solid #d6d3d1; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Tautan Tidak Valid</h1>
    <p>Tautan berhenti berlangganan tidak sah atau telah kedaluwarsa. Silakan kelola preferensi langsung melalui akun Anda.</p>
    <a href="/profile">Buka Pengaturan Akun</a>
  </div>
</body>
</html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  await updateUserNotificationPrefs(userId, {
    reminders: false,
    emailReminders: false,
  });

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Berhasil Berhenti Berlangganan - Biji Hub</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; color: #1c1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; max-width: 440px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 18px; margin: 0 0 8px; color: #1c1917; }
    p { font-size: 14px; color: #57534e; line-height: 1.5; margin: 0 0 20px; }
    a { display: inline-block; font-size: 14px; font-weight: 500; color: #ffffff; background: #78350f; text-decoration: none; padding: 8px 16px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Berhasil Berhenti Berlangganan</h1>
    <p>Anda telah berhenti berlangganan semua pengingat seduh kopi dan email berkala dari Biji Hub. Anda dapat mengaktifkannya kembali kapan saja di profil Anda.</p>
    <a href="/">Kembali ke Beranda</a>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
