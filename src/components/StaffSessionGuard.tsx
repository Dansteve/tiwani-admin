"use client";

// The CLIENT staff-session gate. On the SSR build the server middleware (src/middleware.ts) is the real
// edge gate: every (admin) route redirects to /login without a staff session cookie. On the STATIC-EXPORT
// build (npm run build:static) there is no server runtime and middleware does not run, so this component is
// the gate: mounted once in the (admin) layout, it checks the staff session cookie on mount and sends an
// unauthenticated visitor to /login. Under SSR it is a harmless second check (the middleware already
// redirected). This is a STUB gate over a stub session (Decisions.md D16); nothing real is exposed in
// either build (the data layer is mock by default and there is no service-role key in this app).
//
// It renders nothing and does not block the first paint: it runs its check in an effect and redirects if
// needed. The static demo therefore still gates the admin shell behind the (stub) sign-in.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { readStaffSessionFromDocument } from "@/lib/staff-session";

export function StaffSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // /login is outside the (admin) group, so this only mounts on gated routes. Absent a session, replace
    // (not push) to /login so the unauthenticated route does not stay in history. Carry the intended path
    // as `next` to mirror the middleware (the stub ignores it; the real flow honours it).
    const session = readStaffSessionFromDocument();
    if (!session) {
      const target = pathname && pathname !== "/login"
        ? `/login?next=${encodeURIComponent(pathname)}`
        : "/login";
      router.replace(target);
    }
  }, [pathname, router]);

  return null;
}
