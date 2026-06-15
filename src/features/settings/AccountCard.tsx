import { CircleUser } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { StaffSession } from "@/lib/staff-session";
import { RoleBadge } from "@/features/settings/RoleBadge";

// "Your account": the current staff member (name, email, role) from the session. The role is shown as a
// RoleBadge (colour + label), the same pill used across Settings. Stub values today (the session is the
// pre-production stub); the real identity comes from the separate staff IdP + the admin-api (D16).

export function AccountCard({ session }: { session: StaffSession }) {
  return (
    <Card>
      <CardHeader className="items-start gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <CircleUser className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">Your account</CardTitle>
          <CardDescription className="text-base">
            The staff identity this session is signed in as. Stub values: the real identity comes from
            the separate staff sign-in and the audited admin service (Decisions.md D16).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-base text-foreground">{session.name}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="break-all text-base text-foreground">{session.email}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-muted-foreground">Role</dt>
            <dd>
              <RoleBadge role={session.role} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
