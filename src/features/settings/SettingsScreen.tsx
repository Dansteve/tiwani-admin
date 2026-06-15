"use client";

// The Settings screen: platform settings + RBAC visibility. It composes (top to bottom): the appearance
// control (the built theme selector), "your account" (the session staff member), the read-only staff list,
// the capability matrix (RBAC made visible to the board, generated from rbac.ts), the "add / invite staff
// member" provisioning surface (gated by can(role, "roles.manage"); a pre-production stub), role
// management (same gate; a stub when allowed, view-only otherwise), and the non-sensitive platform-config
// flags.
//
// The role drives the gates: it comes from the session (the pre-production stub, the bootstrap super_admin
// today). The matrix is always shown (read-mostly visibility); the provisioning + role-management controls
// gate on the same can() the admin-api will enforce server-side (D16).

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import { STUB_STAFF, type StaffSession } from "@/lib/staff-session";
import { AccountCard } from "@/features/settings/AccountCard";
import { StaffListCard } from "@/features/settings/StaffListCard";
import { CapabilityMatrix } from "@/features/settings/CapabilityMatrix";
import { AddStaffCard } from "@/features/settings/AddStaffCard";
import { RoleManagementCard } from "@/features/settings/RoleManagementCard";
import { PlatformConfigCard } from "@/features/settings/PlatformConfigCard";

// The session is injected so a test can drive the gates with a different role; it defaults to the stub.
export function SettingsScreen({ session = STUB_STAFF }: { session?: StaffSession }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account, staff and roles, and platform configuration. Synthetic values, for layout and
          review only.
        </p>
      </header>

      <PreProductionBanner />

      {/* Appearance: the real, built theme selector. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription className="text-base">
            Choose how Admin looks. System follows your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle variant="segmented" />
        </CardContent>
      </Card>

      <AccountCard session={session} />

      <StaffListCard />

      <CapabilityMatrix />

      <AddStaffCard role={session.role} />

      <RoleManagementCard role={session.role} />

      <PlatformConfigCard />
    </div>
  );
}
