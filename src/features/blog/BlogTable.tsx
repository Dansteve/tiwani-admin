"use client";

// The blog-post table. It reuses the shared <DataTable> (regular search, NOT search-first: these are
// staff-authored editorial posts, not cross-tenant PII, so a standing list is fine) and renders the
// status as a Badge (colour + label + icon). Row actions live in the shared dropdown-menu: Edit and
// Publish / Unpublish. Every WRITE is gated on can(role, "content.write") at the call site (BlogScreen)
// and again here (writeEnabled): a non-authorized role gets a read-only table with no action menu. The
// status flips go through the adminApi seam (mock today) with an optimistic update + a sonner toast.
//
// Publishing is the gate to the public read API: a "published" post is what the future public,
// unauthenticated endpoint exposes and the website renders (see docs/BLOG.md). Unpublishing pulls it back
// to a draft, so it is no longer public.

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Send, Undo2 } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import type { BlogPost, BlogStatus } from "@/lib/mock/blog";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { blogStatusMeta } from "@/features/blog/blogLabels";

interface BlogTableProps {
  posts: BlogPost[];
  isLoading: boolean;
  /** Whether the current staff role may write (can(role, "content.write")). Hides the actions if false. */
  writeEnabled: boolean;
}

/** The status chip: colour + label + icon (never colour alone). */
function StatusBadge({ status }: { status: BlogStatus }) {
  const meta = blogStatusMeta(status);
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function BlogTable({ posts, isLoading, writeEnabled }: BlogTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogStatus }) =>
      adminApi.setBlogPostStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update: flip the row in the cache immediately, keep the previous list to roll back.
      await queryClient.cancelQueries({ queryKey: ["blog"] });
      const previous = queryClient.getQueryData<BlogPost[]>(["blog"]);
      queryClient.setQueryData<BlogPost[]>(["blog"], (current) =>
        (current ?? []).map((post) => (post.id === id ? { ...post, status } : post)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["blog"], context.previous);
      toast.error("Could not update. Please try again.");
    },
    onSuccess: (_data, { status }) => {
      toast.success(status === "published" ? "Published." : "Moved to draft.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
  });

  const columns: DataTableColumn<BlogPost>[] = [
    {
      id: "title",
      header: "Title",
      cell: (post) => <span className="font-medium text-foreground">{post.title}</span>,
      searchValue: (post) => post.title,
    },
    {
      id: "status",
      header: "Status",
      cell: (post) => <StatusBadge status={post.status} />,
    },
    {
      id: "author",
      header: "Author",
      cell: (post) => <span className="text-muted-foreground">{post.author}</span>,
      searchValue: (post) => post.author,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (post) => <span className="text-muted-foreground">{post.updatedAt}</span>,
    },
  ];

  // The row-actions column only exists for an authorized role; a read-only role never sees the menu.
  if (writeEnabled) {
    columns.push({
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      headClassName: "w-12",
      cellClassName: "text-right",
      cell: (post) => (
        <RowActions
          post={post}
          onSetStatus={statusMutation.mutate}
          onEdit={() => router.push(`/blog/${post.id}/edit`)}
        />
      ),
    });
  }

  return (
    <DataTable
      data={posts}
      columns={columns}
      getRowId={(post) => post.id}
      isLoading={isLoading}
      searchPlaceholder="Search posts by title or author"
      caption="Managed blog posts"
      emptyTitle="No posts yet"
      emptyDescription="There are no blog posts to show. Create the first post to get started."
    />
  );
}

/** The per-row overflow menu: Edit, Publish / Unpublish. */
function RowActions({
  post,
  onSetStatus,
  onEdit,
}: {
  post: BlogPost;
  onSetStatus: (input: { id: string; status: BlogStatus }) => void;
  onEdit: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${post.title}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {post.status === "published" ? (
          <DropdownMenuItem onSelect={() => onSetStatus({ id: post.id, status: "draft" })}>
            <Undo2 aria-hidden="true" />
            Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onSetStatus({ id: post.id, status: "published" })}>
            <Send aria-hidden="true" />
            Publish
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
