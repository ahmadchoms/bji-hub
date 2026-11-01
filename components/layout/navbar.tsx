import { NavbarInner } from "@/components/layout/navbar-inner";
import { getCategories } from "@/lib/data";
import { getServerLocale } from "@/lib/i18n/server";

export async function Navbar() {
  const [categories, locale] = await Promise.all([
    getCategories(),
    getServerLocale(),
  ]);

  return <NavbarInner categories={categories} locale={locale} />;
}
