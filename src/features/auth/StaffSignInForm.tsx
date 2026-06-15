"use client";

// The staff sign-in form. CLIENT-side: on submit it sets the stub session cookie in the browser
// (writeStaffSessionToDocument, the same STUB_STAFF value the old server action wrote) and navigates to the
// dashboard. It was a server-action form; it is now client-side so the same flow works under BOTH builds,
// crucially the static-export build (output: "export" does not support server actions, and the export has
// no server runtime to set an httpOnly cookie). Real fields (email + password) keep the real shape, but the
// STUB validates none of it (any credentials succeed). A visible note states MFA is required in production.
//
// This stays a STUB, not a security boundary (Decisions.md D16): the cookie is a self-made blob, not a
// validated IdP token. The real sign-in is the separate-audience staff IdP with enforced MFA, validated by
// the audited tiwani-admin-api; that lands before this app touches real data.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STUB_STAFF, writeStaffSessionToDocument } from "@/lib/staff-session";

export function StaffSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    // STUB: any credentials succeed. Set the stub session cookie, then go to the intended path (the `next`
    // the middleware / client guard carried) or the dashboard. The form fields are read for shape only.
    writeStaffSessionToDocument(STUB_STAFF);
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@tiwani.internal"
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <Alert variant="warning">
        <ShieldAlert aria-hidden="true" />
        <AlertDescription>
          <p>
            MFA is required in production (stub). Staff accounts are provisioned on a separate identity
            provider, never the family sign-in.
          </p>
        </AlertDescription>
      </Alert>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        Sign in
      </Button>
    </form>
  );
}
