import { NavbarInner } from "@/components/layout/navbar-inner";
import { getSession } from "@/lib/auth/session";

export async function Navbar() {
  const { role } = await getSession();
  return <NavbarInner role={role} />;
}
