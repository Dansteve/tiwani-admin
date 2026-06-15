"use client";

// The CLIENT read of the stub staff session. It exists because the static-export build (npm run
// build:static) has no server runtime, so the (admin) layout and the settings page can no longer resolve
// the role server-side via cookies() (a server-only request API, unavailable under output: "export"). These
// hooks read the same cookie the server middleware checks, on the client, reusing the one codec in
// staff-session.ts (no second session path). This is also correct under SSR: the role-driven gates are
// affordance-only (the real boundary is the future admin-api, D16), so resolving them client-side changes
// nothing about security and makes the tree static-exportable.
//
// HYDRATION: the first render returns STUB_STAFF (the same value the server fell back to), so the server
// HTML and the first client render match; the mount effect then re-reads the actual cookie. This mirrors
// ThemeProvider / DataSourceProvider, which also start from a stable default and correct on mount.

import { useEffect, useState } from "react";

import {
  STUB_STAFF,
  readStaffSessionFromDocument,
  type StaffSession,
} from "@/lib/staff-session";
import type { StaffRole } from "@/lib/rbac";

/**
 * The current stub staff session, resolved client-side from the cookie (falling back to STUB_STAFF when the
 * cookie is absent / unparseable, the same fallback the server used). Stable on first render, corrected on
 * mount. Use this anywhere a page/layout previously read the session via cookies().
 */
export function useStaffSession(): StaffSession {
  const [session, setSession] = useState<StaffSession>(STUB_STAFF);

  useEffect(() => {
    // Defer the state commit to the next frame (the DataSourceProvider / ThemeProvider pattern), so the
    // mount effect does not setState synchronously in its body (a cascading-render the lint flags). The
    // first render already shows STUB_STAFF, so there is no visible flash before the cookie value lands.
    const resolved = readStaffSessionFromDocument() ?? STUB_STAFF;
    const frame = requestAnimationFrame(() => setSession(resolved));
    return () => cancelAnimationFrame(frame);
  }, []);

  return session;
}

/** The current stub staff role (convenience over useStaffSession, for the RBAC affordance gates). */
export function useStaffRole(): StaffRole {
  return useStaffSession().role;
}
