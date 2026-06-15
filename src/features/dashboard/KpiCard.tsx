import { Card, CardContent } from "@/components/ui/card";
import type { AdminMetric } from "@/lib/mock/metrics";

// A single KPI tile: the big number, the label under it, and an optional caption. The number is the one
// SPARING use of the coral accent (a key data point, Docs/Brand.md), set in the brand tiwani-coral token,
// not a hex. The label + caption are warm-grey supporting text. Tiles share one shape so a row of them
// aligns.
export function KpiCard({ metric }: { metric: AdminMetric }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-3xl font-semibold tracking-tight text-tiwani-coral tabular-nums">
          {metric.value}
        </span>
        <span className="text-sm font-medium text-foreground">{metric.label}</span>
        {metric.caption ? (
          <span className="text-xs text-muted-foreground">{metric.caption}</span>
        ) : null}
      </CardContent>
    </Card>
  );
}
