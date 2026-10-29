import { NavbarInner } from "@/components/layout/navbar-inner";
import { getCategories } from "@/lib/data";

export async function Navbar() {
  const categories = await getCategories();

  return <NavbarInner categories={categories} />;
}
