import { Lock, UserCog } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { can, type StaffRole } from "@/lib/rbac";

// Role management: gated by can(role, "roles.manage") (role_admin only, per rbac.ts). There is NO real
// grant store in this app yet, so even when the gate passes this renders a clearly-labeled PRE-PRODUCTION
// STUB: the affordance is shown but disabled, and it makes no real change. When the role lacks
// roles.manage, the card shows a view-only notice instead of the controls (the matrix above stays
// readable to everyone). Real role administration is a default-deny, audit-logged operation in the
// admin-api (D16); it is not wired here.

export function RoleManagementCard({ role }: { role: StaffRole | null }) {
  const canManageRoles = can(role, "roles.manage");

  return (
    <Card>
      <CardHeader className="items-start gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <UserCog className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">Role management</CardTitle>
          <CardDescription className="text-base">
            Assign and change staff roles. Only a role admin can do this, and it is separated from reading
            user records (Decisions.md D16).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canManageRoles ? (
          <>
            <Alert>
              <UserCog aria-hidden="true" />
              <AlertTitle>Pre-production stub: no real change</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-muted-foreground">
                  There is no grant store in the back office yet, so these controls are shown for review
                  but make no change. Role changes become a real, audit-logged action when the admin
                  service lands.
                </p>
              </AlertDescription>
            </Alert>
            {/* The affordance, disabled: it is here so the shape is visible, not to mutate anything. */}
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled aria-disabled="true">
                Assign role
              </Button>
              <Button type="button" variant="outline" disabled aria-disabled="true">
                Revoke role
              </Button>
            </div>
          </>
        ) : (
          <Alert>
            <Lock aria-hidden="true" />
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>
              <p className="mt-1 text-muted-foreground">
                Your role cannot manage staff roles. The capability matrix above is read-only for you.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
