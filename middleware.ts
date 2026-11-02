import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_SESSION_COOKIE, isMockAuthAllowed } from "@/lib/auth/mock-guard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // S5: Exempt Sentry tunnel endpoint from any Supabase auth checks or cookies processing
  if (pathname.startsWith("/monitoring")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/profile");

  if (!url || !key) {
    const hasMock =
      isMockAuthAllowed() && request.cookies.has(MOCK_SESSION_COOKIE);
    if (isProtected && !hasMock) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
      );
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  if (isProtected) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const hasMock =
      isMockAuthAllowed() && request.cookies.has(MOCK_SESSION_COOKIE);

    if (!user && !hasMock) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring).*)",
  ],
};
