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
import { createAdminClient } from "@/lib/supabase/admin";
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
      let { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      // If user is unconfirmed, auto-confirm via admin API and retry
      if (
        error &&
        (error.message?.includes("Email not confirmed") ||
          (error as unknown as { code?: string }).code === "email_not_confirmed")
      ) {
        const admin = createAdminClient();
        if (admin) {
          const { data: userList } = await admin.auth.admin.listUsers();
          const target = userList?.users?.find(
            (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase()
          );
          if (target) {
            await admin.auth.admin.updateUserById(target.id, { email_confirm: true });
            const retry = await supabase.auth.signInWithPassword({
              email: parsed.data.email,
              password: parsed.data.password,
            });
            data = retry.data;
            error = retry.error;
          }
        }
      }

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
          const dbUser = await prisma.user.upsert({
            where: { id: data.user.id },
            create: {
              id: data.user.id,
              email: parsed.data.email,
              role:
                data.user.user_metadata?.role === "seller"
                  ? "SELLER"
                  : data.user.user_metadata?.role === "admin"
                    ? "ADMIN"
                    : "BUYER",
            },
            update: {},
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
      const admin = createAdminClient();
      let userId: string | null = null;

      if (admin) {
        // Create user with pre-confirmed email via Admin API
        const { data, error } = await admin.auth.admin.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          email_confirm: true,
          user_metadata: {
            name: parsed.data.name,
            role: "buyer",
          },
        });

        if (error) {
          if (
            error.message?.includes("already been registered") ||
            (error as unknown as { code?: string }).code === "email_exists"
          ) {
            return fail("Email sudah terdaftar. Silakan login.");
          }
          return fail(error.message || "Pendaftaran gagal. Silakan coba lagi.");
        }
        userId = data.user?.id ?? null;

        // Auto sign-in so user is instantly authenticated in cookieStore
        await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
      } else {
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
        userId = data.user?.id ?? null;
      }

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
