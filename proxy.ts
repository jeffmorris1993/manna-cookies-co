import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const OWNER_EMAIL = "hello@sirromstudios.com";
const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
const SESS_START = "mc_sess_start";
const LAST_SEEN = "mc_last_seen";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // refreshes the token when needed and validates it against the auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isLogin = path === "/login";

  const loginRedirect = (reason?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = reason ? `?${reason}` : "";
    const r = NextResponse.redirect(url);
    // carry over any refreshed auth cookies, then clear our session markers
    response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value));
    r.cookies.delete(SESS_START);
    r.cookies.delete(LAST_SEEN);
    return r;
  };

  if (isDashboard) {
    if (!user) return loginRedirect();

    // single-owner lockout, even if a stray account ever appears
    if (user.email?.toLowerCase() !== OWNER_EMAIL) {
      await supabase.auth.signOut();
      return loginRedirect("denied=1");
    }

    const now = Date.now();
    const start = Number(request.cookies.get(SESS_START)?.value ?? NaN);
    const lastSeen = Number(request.cookies.get(LAST_SEEN)?.value ?? NaN);

    // absolute cap: 7 days from sign-in (missing marker = stale session)
    if (!Number.isFinite(start) || now - start > SESSION_ABSOLUTE_MS) {
      await supabase.auth.signOut();
      return loginRedirect("expired=1");
    }
    // idle cap: 24h without touching the dashboard
    if (Number.isFinite(lastSeen) && now - lastSeen > SESSION_IDLE_MS) {
      await supabase.auth.signOut();
      return loginRedirect("expired=1");
    }

    response.cookies.set(LAST_SEEN, String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_ABSOLUTE_MS / 1000,
    });
    return response;
  }

  if (isLogin && user && user.email?.toLowerCase() === OWNER_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c.name, c.value));
    return r;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/forgot-password", "/reset-password"],
};
