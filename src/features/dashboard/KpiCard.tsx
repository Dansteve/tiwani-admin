import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { AdminMetric, AdminMetricVariant } from "@/lib/mock/metrics";

// A single KPI tile: an icon in a tinted circle, the label, the big value, and an optional small trend
// line. The variant tints the icon circle + the icon (a generic STATUS token, never a finance colour):
// default = teal (primary), success / warning / critical = the dashboard status tokens, muted = warm
// grey. The value is the calm foreground (a count, rendered with tabular figures so a row of cards lines
// up). The trend is colour + an arrow icon + the signed percent text, never colour alone (accessibility).
// Everything resolves to brand tokens; no hardcoded hex.

const ICON_WRAP: Record<AdminMetricVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
  muted: "bg-muted text-muted-foreground",
};

function DeltaLine({ delta }: { delta: NonNullable<AdminMetric["delta"]> }) {
  const direction =
    delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat";
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : Minus;
  const tone =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-critical"
        : "text-muted-foreground";
  const sign = delta.value > 0 ? "+" : "";

  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs", tone)}>
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="tabular-nums">
        {sign}
        {delta.value.toFixed(1)}%
      </span>
      <span className="text-muted-foreground">{delta.label}</span>
    </p>
  );
}

export function KpiCard({ metric }: { metric: AdminMetric }) {
  const variant: AdminMetricVariant = metric.variant ?? "default";
  const Icon = metric.icon;

  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            {metric.label}
          </span>
          <span className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {metric.value}
          </span>
          {metric.caption ? (
            <span className="mt-0.5 text-xs text-muted-foreground">
              {metric.caption}
            </span>
          ) : null}
          {metric.delta ? <DeltaLine delta={metric.delta} /> : null}
        </div>
        {Icon ? (
          <div className={cn("shrink-0 rounded-lg p-2.5", ICON_WRAP[variant])}>
            <Icon aria-hidden="true" className="size-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
