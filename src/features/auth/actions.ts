"use server";

// =============================================================================================
// STAFF AUTH SERVER ACTIONS (STUB, pre-production). NOT real authentication.
//
// These run on the SERVER (the staff gate is server-side, Decisions.md D16). They set / clear the stub
// staff session cookie so the sign-in and sign-out flows are wired end-to-end. They do NO real auth:
// `signIn` accepts ANY credentials and resolves the single STUB_STAFF identity; there is no password
// check, no IdP, no MFA. REPLACED, before this app touches real data, by the real separate-audience
// staff IdP with enforced MFA, validated by the audited tiwani-admin-api (src/lib/staff-session.ts).
//
// The cookie is set httpOnly (not readable by client JS), sameSite=lax, and secure in production, so it
// behaves like a session cookie even as a stub. It is NOT a signed token (a placeholder, not a boundary).
// =============================================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  STAFF_SESSION_COOKIE,
  STUB_STAFF,
  encodeStaffSession,
} from "@/lib/staff-session";

/** Eight hours, a reasonable stub session lifetime (the real IdP owns the real lifetime + refresh). */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * Stub sign-in: accepts any credentials, sets the stub session cookie, and redirects to the dashboard.
 * `_email` / `_password` are read from the form but NOT validated (this is a non-functional placeholder).
 */
export async function signIn(formData: FormData): Promise<void> {
  // Read the fields so the form is wired, but do nothing with them (stub: any credentials succeed).
  void formData.get("email");
  void formData.get("password");

  const store = await cookies();
  store.set(STAFF_SESSION_COOKIE, encodeStaffSession(STUB_STAFF), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}

/** Sign out: clears the stub session cookie and returns to the sign-in screen. */
export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(STAFF_SESSION_COOKIE);
  redirect("/login");
}
