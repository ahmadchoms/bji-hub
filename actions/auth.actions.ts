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
import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/data/prisma/client";
import { slugify } from "@/lib/slug";
import { checkRateLimit } from "@/lib/rate-limit";

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

  const rl = checkRateLimit(
    `login:${parsed.data.email.toLowerCase().trim()}`,
    5,
    60_000,
  );
  if (!rl.success) {
    return fail("Terlalu banyak percobaan login. Silakan tunggu 1 menit.");
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
        return fail("Email atau kata sandi tidak sesuai. Silakan periksa kembali.");
      }

      if (data.user) {
        if (process.env.DATA_SOURCE === "prisma") {
          const prisma = getPrisma();
          const dbUser = await prisma.user.findUnique({
            where: { id: data.user.id },
            include: { sellerProfile: { select: { id: true } } },
          });
          const role = (dbUser?.role?.toLowerCase() as Role) || "buyer";
          return ok({ redirectTo: safeNextPath(next, homeFor(role)) });
        }
        const role = (data.user.user_metadata?.role as Role) || "buyer";
        return ok({ redirectTo: safeNextPath(next, homeFor(role)) });
      }
    } catch {
      // Fall through to mock session if Supabase throws or offline
    }
  }

  // Fallback mock session for local demo/testing
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

  const rl = checkRateLimit(
    `register:${parsed.data.email.toLowerCase().trim()}`,
    3,
    60_000,
  );
  if (!rl.success) {
    return fail("Terlalu banyak pendaftaran. Silakan tunggu 1 menit.");
  }

  // Real Supabase Auth & Prisma record creation
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            name: parsed.data.name,
            role: "buyer",
          },
        },
      });

      if (error) {
        return fail(
          error.message?.includes("already registered")
            ? "Email sudah terdaftar. Silakan login."
            : error.message || "Pendaftaran gagal. Silakan coba lagi."
        );
      }

      if (data.user) {
        if (process.env.DATA_SOURCE === "prisma") {
          const prisma = getPrisma();
          await prisma.user.upsert({
            where: { id: data.user.id },
            create: {
              id: data.user.id,
              email: parsed.data.email,
              role: "BUYER",
            },
            update: {
              email: parsed.data.email,
              role: "BUYER",
            },
          });
        }
        return ok({ redirectTo: "/" });
      }
    } catch {
      // Fall through to mock session if Supabase throws or offline
    }
  }

  // Fallback mock session for local demo/testing
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

      if (user && process.env.DATA_SOURCE === "prisma") {
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
      // Fall through to mock session
    }
  }

  // Fallback mock session for local demo/testing
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
