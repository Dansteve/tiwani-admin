import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wordmark } from "@/components/Wordmark";
import { StaffSignInForm } from "@/features/auth/StaffSignInForm";

export const metadata: Metadata = {
  title: "Sign in - TIWANI Admin",
  robots: { index: false, follow: false },
};

// The staff sign-in screen. Deliberately OUTSIDE the (admin) route group, so it renders with no shell and
// needs no session (it is the middleware redirect target). A calm, centred card with the Wordmark; the
// form is a STUB (src/features/auth/actions.ts) for the real separate-audience staff IdP with enforced
// MFA, gated per Decisions.md D16.
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Wordmark className="text-2xl" />
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Admin
          </span>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Staff sign in</CardTitle>
            <CardDescription className="text-base">
              Internal access only. Pre-production: this is a stub sign-in, not connected to real data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffSignInForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          A separate, audited surface. Staff read is least-privilege, reason-bound, and logged.
        </p>
      </div>
    </main>
  );
}
