import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import { STUB_STAFF } from "@/lib/staff-session";
import { capabilitiesFor } from "@/lib/rbac";

// The Settings screen. The foundation ships the real appearance control (the theme selector, which is
// built) plus a small read-only "your access" panel that shows the STUB staff role + its granted
// capabilities (so the RBAC shape is visible end-to-end); the rest of Settings is a Phase-2 placeholder.
export default function SettingsPage() {
  const capabilities = capabilitiesFor(STUB_STAFF.role);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
      </header>

      <PreProductionBanner />

      {/* Appearance: the real, built theme selector. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
          <CardDescription className="text-base">
            Choose how the back office looks. System follows your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle variant="segmented" />
        </CardContent>
      </Card>

      {/* Your access: the stub role + its capabilities, so the default-deny RBAC shape is visible. */}
      <Card>
        <CardHeader className="items-start gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Your access</CardTitle>
            <CardDescription className="text-base">
              Role and granted capabilities. Stub values: real role resolution and enforcement land
              with the audited admin service (Decisions.md D16).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">Role</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {STUB_STAFF.role}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Capabilities</span>
            <ul className="flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <li
                  key={capability}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {capability}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* The rest of Settings is a Phase-2 placeholder (a light inline card, so the page keeps one h1
          and one pre-production banner). */}
      <Card>
        <CardHeader className="items-start gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <SettingsIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Coming in this module</CardTitle>
            <CardDescription className="text-base">
              Staff management, role grants, and audit-log controls. Each is a default-deny,
              reason-required, logged operation in the admin service (Decisions.md D16).
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
