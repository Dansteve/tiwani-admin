import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";

// A clean, on-brand "Coming in this module" placeholder for a Phase-2 route (Users / Content / Reporting
// / Settings, less the parts the foundation builds). The nav is whole and every route resolves; the
// Phase-2 developers replace the placeholder with their screen. Carries the pre-production banner so the
// honest "mock data" label is on every surface.
export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      </header>

      <PreProductionBanner />

      <Card>
        <CardHeader className="items-start gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Coming in this module</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This route is wired into the shell so the navigation is complete. The module screen lands
            here, behind the audited admin service and its access gates (Decisions.md D16).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
