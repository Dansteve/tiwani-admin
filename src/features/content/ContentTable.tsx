"use client";

// The managed-content table. It reuses the shared <DataTable> (regular search, NOT search-first: this is
// platform content, not cross-tenant PII, so a standing list is fine) and renders the status + type as
// Badges (colour + label + icon). Row actions live in the shared dropdown-menu: Edit, Publish / Unpublish,
// Archive. Every WRITE is gated on can(role, "content.write") at the call site (ContentScreen) and again
// here (writeEnabled): a non-authorized role gets a read-only table with no action menu. The status flips
// go through the adminApi seam (mock today) with an invalidate + a sonner toast.

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Send, Undo2, Archive } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import type { AdminContentItem, ContentStatus } from "@/lib/mock/content";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { contentStatusMeta, contentTypeMeta } from "@/features/content/contentLabels";

interface ContentTableProps {
  items: AdminContentItem[];
  isLoading: boolean;
  /** Whether the current staff role may write (can(role, "content.write")). Hides the actions if false. */
  writeEnabled: boolean;
}

/** The status chip: colour + label + icon (never colour alone). */
function StatusBadge({ status }: { status: ContentStatus }) {
  const meta = contentStatusMeta(status);
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function ContentTable({ items, isLoading, writeEnabled }: ContentTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) =>
      adminApi.setContentStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update: flip the row in the cache immediately, keep the previous list to roll back.
      await queryClient.cancelQueries({ queryKey: ["content"] });
      const previous = queryClient.getQueryData<AdminContentItem[]>(["content"]);
      queryClient.setQueryData<AdminContentItem[]>(["content"], (current) =>
        (current ?? []).map((item) => (item.id === id ? { ...item, status } : item)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["content"], context.previous);
      toast.error("Could not update. Please try again.");
    },
    onSuccess: (_data, { status }) => {
      const verb =
        status === "published" ? "Published." : status === "archived" ? "Archived." : "Moved to draft.";
      toast.success(verb);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });

  const columns: DataTableColumn<AdminContentItem>[] = [
    {
      id: "title",
      header: "Title",
      cell: (item) => <span className="font-medium text-foreground">{item.title}</span>,
      searchValue: (item) => item.title,
    },
    {
      id: "type",
      header: "Type",
      cell: (item) => {
        const meta = contentTypeMeta(item.type);
        const Icon = meta.icon;
        return (
          <Badge variant="outline">
            <Icon aria-hidden="true" />
            {meta.label}
          </Badge>
        );
      },
      searchValue: (item) => contentTypeMeta(item.type).label,
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (item) => <span className="text-muted-foreground">{item.updatedAt}</span>,
    },
  ];

  // The row-actions column only exists for an authorized role; a read-only role never sees the menu.
  if (writeEnabled) {
    columns.push({
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      headClassName: "w-12",
      cellClassName: "text-right",
      cell: (item) => <RowActions item={item} onSetStatus={statusMutation.mutate} onEdit={() => router.push(`/content/${item.id}/edit`)} />,
    });
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      getRowId={(item) => item.id}
      isLoading={isLoading}
      searchPlaceholder="Search content by title or type"
      caption="Managed platform content"
      emptyTitle="No content yet"
      emptyDescription="There is no platform content to show. Create the first item to get started."
    />
  );
}

/** The per-row overflow menu: Edit, Publish / Unpublish, Archive. */
function RowActions({
  item,
  onSetStatus,
  onEdit,
}: {
  item: AdminContentItem;
  onSetStatus: (input: { id: string; status: ContentStatus }) => void;
  onEdit: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${item.title}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {item.status === "published" ? (
          <DropdownMenuItem onSelect={() => onSetStatus({ id: item.id, status: "draft" })}>
            <Undo2 aria-hidden="true" />
            Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onSetStatus({ id: item.id, status: "published" })}>
            <Send aria-hidden="true" />
            Publish
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={item.status === "archived"}
          onSelect={() => onSetStatus({ id: item.id, status: "archived" })}
        >
          <Archive aria-hidden="true" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
