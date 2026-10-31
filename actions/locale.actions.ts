"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_LOCALE, type Locale } from "@/lib/i18n";

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_LOCALE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { success: true, locale };
}
