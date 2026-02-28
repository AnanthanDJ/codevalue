import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Protected routes — redirect to login if not authed
  const protectedRoutes = ["/dashboard", "/org/dashboard", "/org/onboard", "/onboard"];
  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in — redirect away from login
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/redirect", req.url));
  }

  return res;
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
