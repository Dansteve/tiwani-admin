import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/lib/mock/metrics";

// The "platform activity" panel: a simple, calm list of recent (mock) items. Each row is a summary +
// a relative-time label. A clock dot in the calm teal-mid status token marks each item (a non-colour
// signal pairs with the text). No PII (this is mock data anyway, and the real feed is minimised + logged).
export function ActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Platform activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={
                index === 0
                  ? "flex items-start gap-3 py-3"
                  : "flex items-start gap-3 border-t border-border py-3"
              }
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-2 shrink-0 rounded-full bg-status-stable"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm text-foreground">{item.summary}</span>
                <span className="text-xs text-muted-foreground">{item.when}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
