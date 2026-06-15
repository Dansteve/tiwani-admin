"use client";

// The waitlist sub-view: the E1 surface, the LOWEST-sensitivity operational view (a public marketing-site
// signup, an email + a care-context, no family data behind it). A standing list is acceptable here (not
// cross-tenant PII), so it uses the shared <DataTable> with regular search. The one action, "Mark
// contacted", flips a row through the adminApi seam (mock today) with an optimistic update + a toast. The
// action is gated on can(role, "waitlist.manage") at the call site; this panel renders it via canManage.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import type { WaitlistEntry } from "@/lib/mock/waitlist";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { careContextLabel, waitlistStatusMeta } from "@/features/content/contentLabels";

interface WaitlistPanelProps {
  entries: WaitlistEntry[];
  isLoading: boolean;
  /** Whether the current staff role may manage the waitlist (can(role, "waitlist.manage")). */
  canManage: boolean;
}

export function WaitlistPanel({ entries, isLoading, canManage }: WaitlistPanelProps) {
  const queryClient = useQueryClient();

  const contactMutation = useMutation({
    mutationFn: (id: string) => adminApi.markWaitlistContacted(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["waitlist"] });
      const previous = queryClient.getQueryData<WaitlistEntry[]>(["waitlist"]);
      queryClient.setQueryData<WaitlistEntry[]>(["waitlist"], (current) =>
        (current ?? []).map((entry) =>
          entry.id === id ? { ...entry, status: "contacted" } : entry,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["waitlist"], context.previous);
      toast.error("Could not update. Please try again.");
    },
    onSuccess: () => {
      toast.success("Marked as contacted.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["waitlist"] });
    },
  });

  const columns: DataTableColumn<WaitlistEntry>[] = [
    {
      id: "email",
      header: "Email",
      cell: (entry) => <span className="font-medium text-foreground">{entry.email}</span>,
      searchValue: (entry) => entry.email,
    },
    {
      id: "context",
      header: "Care context",
      cell: (entry) => careContextLabel(entry.careContext),
      searchValue: (entry) => careContextLabel(entry.careContext),
    },
    {
      id: "signedUp",
      header: "Signed up",
      cell: (entry) => <span className="text-muted-foreground">{entry.signedUpAt}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (entry) => {
        const meta = waitlistStatusMeta(entry.status);
        const Icon = meta.icon;
        return (
          <Badge variant={meta.variant}>
            <Icon aria-hidden="true" />
            {meta.label}
          </Badge>
        );
      },
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      cellClassName: "text-right",
      cell: (entry) =>
        entry.status === "contacted" ? (
          <span className="text-sm text-muted-foreground">Done</span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => contactMutation.mutate(entry.id)}
            aria-label={`Mark ${entry.email} as contacted`}
          >
            <MailCheck aria-hidden="true" />
            Mark contacted
          </Button>
        ),
    });
  }

  return (
    <DataTable
      data={entries}
      columns={columns}
      getRowId={(entry) => entry.id}
      isLoading={isLoading}
      searchPlaceholder="Search by email"
      caption="Waitlist signups"
      emptyTitle="No signups yet"
      emptyDescription="There are no waitlist signups to show."
    />
  );
}
