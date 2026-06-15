import { SlidersHorizontal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Platform config: a few NON-sensitive, display-only feature flags (mock). There is no config store yet,
// so each flag is shown as a read-only stub state (a Badge with colour + a label, never colour alone), not
// a live switch: it reflects a default, it does not mutate anything.
//
// RED LINE (Decisions.md D16): audit logging, the reason requirement, and maker-checker are NOT
// staff-configurable. They are core accountability controls, always on, and never appear here as a toggle,
// not even a stub. This list is therefore a fixed set of benign, non-sensitive flags only; a test asserts
// none of those terms appear as a configurable row.

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  /** The default state shown (read-only). */
  enabled: boolean;
}

// Benign, non-sensitive display flags only. Deliberately excludes anything that would weaken an
// accountability control (no audit-log toggle, no reason-requirement toggle, no maker-checker toggle).
// Exported so a test can assert structurally that no forbidden flag is ever configurable here.
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: "waitlist_export_csv",
    label: "Waitlist CSV export",
    description: "Allow exporting the aggregate waitlist as a CSV from the waitlist module.",
    enabled: true,
  },
  {
    key: "content_drafts",
    label: "Content drafts",
    description: "Let editors save content items as drafts before publishing.",
    enabled: true,
  },
  {
    key: "reporting_weekly_digest",
    label: "Weekly reporting digest",
    description: "Send the team an aggregate weekly summary email of platform totals.",
    enabled: false,
  },
];

function FlagState({ enabled }: { enabled: boolean }) {
  // Colour + label (the Badge text), never colour alone.
  return enabled ? (
    <Badge variant="success">On</Badge>
  ) : (
    <Badge variant="outline">Off</Badge>
  );
}

export function PlatformConfigCard() {
  return (
    <Card>
      <CardHeader className="items-start gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <SlidersHorizontal className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">Platform config</CardTitle>
          <CardDescription className="text-base">
            Non-sensitive feature flags. Pre-production stub: states shown for review, no real change.
            Accountability controls (audit log, reason requirement, maker-checker) are always on and are
            not configurable here (Decisions.md D16).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul aria-label="Feature flags" className="flex flex-col">
          {FEATURE_FLAGS.map((flag, index) => (
            <li key={flag.key} className="flex flex-col gap-2">
              {index > 0 ? <Separator className="my-1" /> : null}
              <div className="flex items-start justify-between gap-4 py-1">
                <div className="flex min-w-0 flex-col">
                  <span className="text-base font-medium text-foreground">{flag.label}</span>
                  <span className="text-sm text-muted-foreground">{flag.description}</span>
                </div>
                <FlagState enabled={flag.enabled} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
