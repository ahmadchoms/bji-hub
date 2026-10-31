# Runbook Staging Environment (WS-E / E1)

Dokumen ini adalah panduan operasional resmi untuk menyiapkan, menjalankan, dan memvalidasi lingkungan **Staging** terpisah untuk Biji Corp (Bji-Hub).

---

## 1. Arsitektur Isolasi Lingkungan

> **Prinsip Utama:** Lingkungan Production dan Staging **TIDAK BOLEH** berbagi database, kunci API, bucket penyimpanan, atau gateway pembayaran.

| Komponen | Staging | Production |
| :--- | :--- | :--- |
| **Hosting** | Vercel (Preview / Branch Deploy) | Vercel (Production) |
| **Database & Auth** | Supabase Project `bji-hub-staging` | Supabase Project `bji-hub-prod` |
| **Storage Bucket** | `listings` (public), `seller-kyc` (private, 5 MB) | `listings` (public), `seller-kyc` (private, 5 MB) |
| **Midtrans** | Sandbox (`MIDTRANS_IS_PRODUCTION=false`) | Production (`MIDTRANS_IS_PRODUCTION=true`) |
| **Email (Resend)** | Domain Sandbox / Development | Domain Produksi Terverifikasi |
| **Sentry** | DSN Staging terpisah | DSN Production terpisah |

---

## 2. Langkah Penyiapan Supabase Staging

1. **Buat Proyek Baru** di Supabase Console: `bji-hub-staging`.
2. **Setup Storage Buckets**:
   - `listings`: Public bucket, MIME types `image/jpeg, image/png, image/webp`, max file size 5 MB.
   - `seller-kyc`: **Private bucket**, MIME types `image/jpeg, image/png, image/webp, application/pdf`, max file size 5 MB.
3. **Deploy Migrasi**:
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST-STAGING]:5432/postgres" npx prisma migrate deploy
   ```
4. **Verifikasi RLS**:
   ```bash
   node scripts/verify-rls.mjs --url "https://[PROJECT-STAGING].supabase.co" --key "[STAGING-ANON-KEY]"
   ```

---

## 3. Konfigurasi Vercel Preview (Staging)

Masukkan variabel berikut ke dalam dashboard Vercel untuk environment **Preview**:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://[STAGING-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[STAGING-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[STAGING-SERVICE-ROLE-KEY]

MIDTRANS_SERVER_KEY=[SB-Mid-server-...]
MIDTRANS_CLIENT_KEY=[SB-Mid-client-...]
MIDTRANS_IS_PRODUCTION=false
PAYMENT_PROVIDER=midtrans

NEXT_PUBLIC_APP_URL=https://staging.bji-hub.com
CRON_SECRET=[RANDOM-64-CHAR-HEX]
HEALTH_CHECK_TOKEN=[RANDOM-64-CHAR-HEX]
PAYOUT_ENC_KEY=[RANDOM-32-BYTES-BASE64]
ADMIN_MFA_REQUIRED=true
DATA_SOURCE=prisma
```

---

## 4. Konfigurasi Midtrans Sandbox

1. Masuk ke [Midtrans MAP Sandbox](https://dashboard.sandbox.midtrans.com/).
2. Masuk ke **Settings > Configuration**:
   - **Payment Notification URL**: `https://staging.bji-hub.com/api/webhooks/midtrans`
   - **Finish Redirect URL**: `https://staging.bji-hub.com/order/success`
   - **Unfinish Redirect URL**: `https://staging.bji-hub.com/order/pending`
   - **Error Redirect URL**: `https://staging.bji-hub.com/order/failed`

---

## 5. Prosedur Pengujian & Validasi Pasca-Deploy

1. **Uji Validasi Environment Isolation**:
   ```bash
   node scripts/verify-env.mjs --staging .env.staging --production .env.production
   ```
2. **Deep Health Check**:
   ```bash
   curl -fsS -H "Authorization: Bearer ${HEALTH_CHECK_TOKEN}" https://staging.bji-hub.com/api/health?deep=1
   ```
3. **Smoke Test Transaksional**:
   ```bash
   BASE_URL=https://staging.bji-hub.com npm run smoke
   ```
