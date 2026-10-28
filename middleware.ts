import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MOCK_SESSION_COOKIE, isMockAuthAllowed } from "@/lib/auth/mock-guard";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // S5: Exempt Sentry tunnel endpoint from any Supabase auth checks or cookies processing
  if (pathname.startsWith("/monitoring")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

  if (!url || !key) {
    const hasMock =
      isMockAuthAllowed() && request.cookies.has(MOCK_SESSION_COOKIE);
    if (isProtected && !hasMock) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
      );
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasMock =
    isMockAuthAllowed() && request.cookies.has(MOCK_SESSION_COOKIE);

  if (isProtected && !user && !hasMock) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|monitoring|api/webhooks|api/cron|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)",
  ],
};
