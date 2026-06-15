// =============================================================================================
// THE STAFF-AUTH GATE (server-side). The architectural point of this app (Decisions.md D16).
//
// tiwani-admin reads ACROSS tenants, which INVERTS the family product's RLS tenant-isolation, so access
// is gated at the EDGE, on the server, BEFORE any page renders: no privileged surface ships to an
// unauthenticated browser. This is the reason the app is SSR (next.config.ts has no `output: 'export'`),
// not a static export.
//
// The rule: every route redirects to /login UNLESS it presents a staff session cookie. /login itself
// and the framework's static assets are exempt (so the redirect target and the styling load). The cookie
// is a STUB today (src/lib/staff-session.ts); the real gate validates a separate-audience, MFA-asserted
// staff token. The middleware's SHAPE (deny by default, exempt only the login + assets) is what stays.
// =============================================================================================

import { NextResponse, type NextRequest } from "next/server";

import { STAFF_SESSION_COOKIE } from "@/lib/staff-session";

/** The only path open to an unauthenticated staff member: the sign-in screen. */
const LOGIN_PATH = "/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /login is always reachable (it is the redirect target). If a signed-in staff member lands on /login,
  // send them to the dashboard rather than show the sign-in form again.
  if (pathname === LOGIN_PATH) {
    const hasSession = Boolean(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Every other matched route requires a staff session. Absent it, redirect to /login and carry the
  // intended path as `next` so the sign-in can return there (the stub ignores it; the real flow honours it).
  const hasSession = Boolean(request.cookies.get(STAFF_SESSION_COOKIE)?.value);
  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// The matcher exempts the framework's static + internal assets and the favicon, so the gate runs on
// actual pages/routes only (the styling and chunks load on /login without a session). Everything else,
// including "/", is gated. Kept as a deny-by-default matcher: it matches all paths EXCEPT the listed
// asset prefixes.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
