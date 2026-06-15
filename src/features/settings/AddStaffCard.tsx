"use client";

import * as React from "react";
import { Lock, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { can, STAFF_ROLES, type StaffRole } from "@/lib/rbac";
import { ROLE_DISPLAY } from "@/features/settings/roleDisplay";
import { toast } from "@/lib/toast";

// "Add / invite staff member": the visible process to add a user. Staff are PROVISIONED (invited by
// email + assigned a role), never self-register (see docs/STAFF.md). Gated by can(role, "roles.manage")
// (super_admin / role_admin), the same gate the admin-api will enforce server-side (D16); a role without
// it sees a view-only notice, not the form.
//
// This is a clearly-labeled PRE-PRODUCTION STUB: there is no real provisioning here (the frontend holds no
// data and no service-role key). On submit it records nothing real, it shows a toast saying the invite was
// recorded as a stub. The real flow runs through the separate staff IdP (MFA-enforced) + the audited
// tiwani-admin-api, behind the launch gates.

/** The default role a new invite starts on: the least-privilege support role (never a high grant). */
const DEFAULT_ROLE: StaffRole = "support_read";

export function AddStaffCard({ role }: { role: StaffRole | null }) {
  const canManageRoles = can(role, "roles.manage");
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<StaffRole>(DEFAULT_ROLE);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // No real provisioning: prevent the default navigation and surface the stub feedback only.
    event.preventDefault();
    toast.message("Invite recorded (stub) - real provisioning lands with the admin-api", {
      description: `${email || "(no email)"} as ${ROLE_DISPLAY[inviteRole].label}. No real change.`,
    });
    setEmail("");
    setInviteRole(DEFAULT_ROLE);
  }

  return (
    <Card>
      <CardHeader className="items-start gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <UserPlus className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">Add / invite staff member</CardTitle>
          <CardDescription className="text-base">
            Staff are invited by email and assigned a role; they never self-register. Only a role admin
            can do this (Decisions.md D16). See the staff provisioning doc for the real flow.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canManageRoles ? (
          <>
            <Alert>
              <UserPlus aria-hidden="true" />
              <AlertTitle>Pre-production stub: no real invite is sent</AlertTitle>
              <AlertDescription>
                <p className="mt-1 text-muted-foreground">
                  Real provisioning runs through the separate staff sign-in (with enforced MFA) and the
                  audited admin service. This form records nothing yet; submitting only confirms the
                  shape.
                </p>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field
                label="Work email"
                name="email"
                type="email"
                autoComplete="off"
                placeholder="name@tiwani.internal"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5 sm:max-w-sm">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as StaffRole)}
                >
                  <SelectTrigger id="invite-role" aria-label="Role for the new staff member">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROLE_DISPLAY[option].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit">
                  <UserPlus aria-hidden="true" />
                  Send invite
                </Button>
              </div>
            </form>
          </>
        ) : (
          <Alert>
            <Lock aria-hidden="true" />
            <AlertTitle>Inviting staff is view only</AlertTitle>
            <AlertDescription>
              <p className="mt-1 text-muted-foreground">
                Your role cannot invite staff. Adding a staff member is a role-admin action, separated
                from reading user records.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
