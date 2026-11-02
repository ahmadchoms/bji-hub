import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasAdminRole } from "@/lib/auth/admin-guard";
import { checkPendingConsentsAction } from "@/actions/consent.actions";
import { PublicShell } from "@/components/layout/public-shell";

const EXEMPT_PATHS = [
  "/consent",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/shipping-policy",
  "/logout",
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
];

function isPathExempt(pathname: string): boolean {
  if (!pathname) return false;
  if (EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/monitoring")
  ) {
    return true;
  }
  return false;
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session.role !== "guest" && !hasAdminRole(session) && session.userId) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || "";

    if (pathname && !isPathExempt(pathname)) {
      const pending = await checkPendingConsentsAction();
      if (pending.success && !pending.data.allAccepted) {
        const nextQuery = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
        redirect(`/consent${nextQuery}`);
      }
    }
  }

  return <PublicShell>{children}</PublicShell>;
}
