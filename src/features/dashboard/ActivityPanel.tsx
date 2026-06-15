import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import type { ActivityItem } from "@/lib/mock/metrics";

// The "recent activity" panel: the mock activity rendered with the shared Table primitives inside a Card.
// Each row is a plain-words summary + a relative-time label (the time right-aligned and muted). When
// there is no activity it shows the shared EmptyState. No PII (this is mock data anyway, and the real
// feed is minimised + audit-logged).
export function ActivityPanel({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Platform activity will appear here as Coordinators and content change."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <caption className="sr-only">Recent platform activity</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-normal text-foreground">
                  {item.summary}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.when}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
