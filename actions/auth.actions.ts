import { z } from "zod";
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  sellerOnboardingSchema,
} from "@/lib/validations/auth.schema";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  homeFor,
  mockRoleFromEmail,
  safeNextPath,
  type Role,
} from "@/lib/auth/roles";
import { MOCK_SESSION_COOKIE, getSession } from "@/lib/auth/session";
import { isMockAuthAllowed } from "@/lib/auth/mock-guard";
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { slugify } from "@/lib/slug";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import type { BuyerAddress } from "@/types";
import { readBuyerProfileCookie, serializeBuyerProfile, BUYER_PROFILE_COOKIE, buyerAddressSchema } from "@/lib/auth/buyer-profile";

async function setMockSession(role: Role): Promise<void> {
  const store = await cookies();
  store.set(MOCK_SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function checkAuthAction(): Promise<boolean> {
  const session = await getSession();
  return session.role !== "guest";
}

export async function loginAction(
  input: unknown,
  next?: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const ip = await getClientIp();
  const ipRl = await checkRateLimit(`login:ip:${ip}`, 20, 60_000);
  if (!ipRl.success) {
    return fail("Terlalu banyak percobaan login dari IP ini. Silakan tunggu 1 menit.");
  }

  const emailRl = await checkRateLimit(
    `login:email:${parsed.data.email.toLowerCase().trim()}`,
    5,
    60_000,
  );
  if (!emailRl.success) {
    return fail("Terlalu banyak percobaan login untuk akun ini. Silakan tunggu 1 menit.");
  }

  // Real Supabase Auth when credentials exist
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        if (
          error.message?.includes("Email not confirmed") ||
          (error as unknown as { code?: string }).code === "email_not_confirmed"
        ) {
          return fail("Email belum dikonfirmasi. Silakan periksa inbox email Anda.");
        }
        return fail("Email atau kata sandi tidak sesuai. Silakan periksa kembali.");
      }

      if (data.user) {
        if (process.env.DATA_SOURCE !== "mock") {
          const prisma = getPrisma();
          let dbUser = await prisma.user.findUnique({
            where: { id: data.user.id },
            include: { sellerProfile: { select: { id: true } } },
          });

          if (!dbUser) {
            await prisma.user.create({
              data: {
                id: data.user.id,
                email: parsed.data.email,
                role: "BUYER",
              },
            });
            dbUser = await prisma.user.findUnique({
              where: { id: data.user.id },
              include: { sellerProfile: { select: { id: true } } },
            });
          }

          const role = (dbUser?.role?.toLowerCase() as Role) || "buyer";
          return ok({ redirectTo: safeNextPath(next, homeFor(role)) });
        }
        return ok({ redirectTo: safeNextPath(next, homeFor("buyer")) });
      }
    } catch {
      if (!isMockAuthAllowed()) {
        return fail("Layanan autentikasi sedang bermasalah. Silakan coba beberapa saat lagi.");
      }
    }
  }

  // Fallback mock session for local test suite & mock mode ONLY
  if (!isMockAuthAllowed()) {
    return fail("Email atau kata sandi tidak sesuai.");
  }

  const role = mockRoleFromEmail(parsed.data.email);
  await setMockSession(role);
  return ok({ redirectTo: safeNextPath(next, homeFor(role)) });
}

export async function registerAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const ip = await getClientIp();
  const ipRl = await checkRateLimit(`register:ip:${ip}`, 10, 60_000);
  if (!ipRl.success) {
    return fail("Terlalu banyak pendaftaran dari IP ini. Silakan tunggu 1 menit.");
  }

  const emailRl = await checkRateLimit(
    `register:email:${parsed.data.email.toLowerCase().trim()}`,
    3,
    60_000,
  );
  if (!emailRl.success) {
    return fail("Terlalu banyak pendaftaran untuk email ini. Silakan tunggu 1 menit.");
  }

  // Real Supabase Auth & Prisma record creation
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            name: parsed.data.name,
          },
          emailRedirectTo: `${appUrl}/auth/callback?next=/`,
        },
      });

      if (error) {
        return fail(
          error.message?.includes("already registered") ||
            error.message?.includes("already been registered")
            ? "Email sudah terdaftar. Silakan login."
            : error.message || "Pendaftaran gagal. Silakan coba lagi.",
        );
      }

      const userId = data.user?.id ?? null;
      if (userId) {
        if (process.env.DATA_SOURCE !== "mock") {
          const prisma = getPrisma();
          await prisma.user.upsert({
            where: { id: userId },
            create: {
              id: userId,
              email: parsed.data.email,
              role: "BUYER",
            },
            update: {
              email: parsed.data.email,
            },
          });
        }
        return ok({ redirectTo: "/login?verify=1" });
      }
    } catch {
      if (!isMockAuthAllowed()) {
        return fail(
          "Layanan pendaftaran sedang bermasalah. Silakan coba beberapa saat lagi.",
        );
      }
    }
  }

  if (isMockAuthAllowed()) {
    const role = "buyer";
    await setMockSession(role);
    return ok({ redirectTo: "/" });
  }

  return ok({ redirectTo: "/login?verify=1" });

  // Fallback mock session for local test suite & mock mode ONLY
  if (!isMockAuthAllowed()) {
    return fail("Pendaftaran gagal.");
  }

  await setMockSession("buyer");
  return ok({ redirectTo: "/" });
}

export async function becomeSellerAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await getSession();
  if (session.role === "seller") {
    return ok({ redirectTo: "/dashboard" });
  }

  const parsed = sellerOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Data tidak valid",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  // Real Supabase Auth & Prisma seller creation
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && process.env.DATA_SOURCE !== "mock") {
        const prisma = getPrisma();
        const baseSlug = slugify(parsed.data.businessName);
        let slug = baseSlug;
        let counter = 1;

        while (await prisma.sellerProfile.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter++}`;
        }

        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { role: "SELLER" },
          }),
          prisma.sellerProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              businessName: parsed.data.businessName,
              slug,
              province: parsed.data.province,
              city: parsed.data.city,
              address: parsed.data.address,
              whatsappNumber: parsed.data.whatsappNumber,
              tier: "free",
              isVerified: false,
            },
            update: {
              businessName: parsed.data.businessName,
              province: parsed.data.province,
              city: parsed.data.city,
              address: parsed.data.address,
              whatsappNumber: parsed.data.whatsappNumber,
            },
          }),
        ]);

        return ok({ redirectTo: "/dashboard" });
      }
    } catch {
      if (!isMockAuthAllowed()) {
        return fail("Gagal mendaftarkan toko. Silakan coba beberapa saat lagi.");
      }
    }
  }

  // Fallback mock session for local test suite & mock mode ONLY
  if (!isMockAuthAllowed()) {
    return fail("Gagal mendaftarkan toko.");
  }

  await setMockSession("seller");
  return ok({ redirectTo: "/dashboard" });
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  const store = await cookies();
  store.delete(MOCK_SESSION_COOKIE);
  redirect("/");
}

export async function updateBuyerProfileAction(input: {
  name: string;
  avatarUrl?: string;
  phone?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  addresses?: BuyerAddress[];
}): Promise<ActionResult<{ success: boolean }>> {
  if (!input.name || input.name.trim().length < 2) {
    return fail("Nama minimal 2 karakter", {
      name: ["Nama minimal 2 karakter"],
    });
  }

  const cookieStore = await cookies();
  const existingData = readBuyerProfileCookie(cookieStore);

  const rawAddresses = input.addresses ?? (existingData.addresses as BuyerAddress[]) ?? [];
  const parsedAddresses = z.array(buyerAddressSchema).max(10, "Maksimal 10 alamat tersimpan").safeParse(rawAddresses);
  if (!parsedAddresses.success) {
    return fail(parsedAddresses.error.issues[0]?.message || "Format alamat tidak valid");
  }
  const currentAddresses = parsedAddresses.data as BuyerAddress[];
  const primaryAddr = currentAddresses.find((a) => a.isPrimary) || currentAddresses[0];

  const resolvedProvince = input.province?.trim() || primaryAddr?.province || existingData.province || null;
  const resolvedCity = input.city?.trim() || primaryAddr?.city || existingData.city || null;
  const resolvedPostal = input.postalCode?.trim() || primaryAddr?.postalCode || existingData.postalCode || null;
  const resolvedAddress = input.address?.trim() || primaryAddr?.address || existingData.address || null;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return fail("Sesi tidak valid. Silakan masuk kembali.");
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          name: input.name.trim(),
          avatar_url: input.avatarUrl?.trim() || null,
          phone: input.phone?.trim() || null,
          province: resolvedProvince,
          city: resolvedCity,
          postal_code: resolvedPostal,
          address: resolvedAddress,
          addresses: currentAddresses,
        },
      });

      if (error) {
        return fail(error.message || "Gagal memperbarui profil.");
      }
    } catch {
      // Fall through for mock
    }
  }

  try {
    const payload = {
      name: input.name.trim(),
      avatarUrl: input.avatarUrl?.trim() || null,
      phone: input.phone?.trim() || null,
      province: resolvedProvince,
      city: resolvedCity,
      postalCode: resolvedPostal,
      address: resolvedAddress,
      addresses: currentAddresses,
    };
    const serialized = serializeBuyerProfile(payload);
    cookieStore.set(BUYER_PROFILE_COOKIE, serialized, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch (err: any) {
    return fail(err?.message || "Gagal menyimpan cookie profil.");
  }

  return ok({ success: true });
}

export async function updateBuyerAddressesAction(
  addresses: BuyerAddress[],
): Promise<ActionResult<{ success: boolean }>> {
  if (!Array.isArray(addresses)) {
    return fail("Format daftar alamat tidak valid.");
  }

  const parsedAddresses = z.array(buyerAddressSchema).max(10, "Maksimal 10 alamat tersimpan").safeParse(addresses);
  if (!parsedAddresses.success) {
    return fail(parsedAddresses.error.issues[0]?.message || "Format alamat tidak valid");
  }
  const validAddresses = parsedAddresses.data as BuyerAddress[];
  const primary = validAddresses.find((a) => a.isPrimary) || validAddresses[0];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: {
            addresses: validAddresses,
            province: primary ? primary.province.trim() : null,
            city: primary ? primary.city.trim() : null,
            postal_code: primary ? (primary.postalCode?.trim() || null) : null,
            address: primary ? primary.address.trim() : null,
          },
        });
      }
    } catch {
      // Fall through for mock
    }
  }

  try {
    const store = await cookies();
    const existing = readBuyerProfileCookie(store);
    const payload = {
      ...existing,
      addresses: validAddresses,
      province: primary ? primary.province.trim() : existing.province || null,
      city: primary ? primary.city.trim() : existing.city || null,
      postalCode: primary ? (primary.postalCode?.trim() || null) : existing.postalCode || null,
      address: primary ? primary.address.trim() : existing.address || null,
    };
    const serialized = serializeBuyerProfile(payload);
    store.set(BUYER_PROFILE_COOKIE, serialized, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  } catch (err: any) {
    return fail(err?.message || "Gagal menyimpan cookie profil.");
  }

  return ok({ success: true });
}
