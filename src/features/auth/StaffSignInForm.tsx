// The staff sign-in form. POSTs to the `signIn` server action (which sets the stub session cookie
// server-side and redirects to the dashboard). Real fields (email + password) so the form is the real
// shape, but the STUB action validates none of it (any credentials succeed). A visible note states that
// MFA is required in production (this is a placeholder for the real separate-audience staff IdP).
//
// This is a server component (no client state): the action is a server action and the submit is a plain
// form POST, so the sign-in works without JavaScript.

import { ShieldAlert } from "lucide-react";

import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/features/auth/actions";

export function StaffSignInForm() {
  return (
    <form action={signIn} className="flex flex-col gap-4">
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

      <Button type="submit" size="lg" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
