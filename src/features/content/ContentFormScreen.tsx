"use client";

// The create / edit form route wrapper. It owns the page chrome (header, back link, pre-production
// banner), the RBAC route guard, and (for edit) loading the item from the adminApi seam. The actual
// fields + validation + save live in ContentForm. Splitting it this way keeps the route pages thin and
// the form reusable.
//
// RBAC: writes need can(role, "content.write"). A role without it is redirected back to /content (the
// list CTA is already hidden for that role; this makes the route defensive too). The role comes from the
// stub staff session (STUB_STAFF), the same pattern the Settings + Content screens use; it is the
// affordance decision only, never the security boundary (server-side enforcement lands with the audited
// admin-api, Decisions.md D16).

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { can } from "@/lib/rbac";
import { STUB_STAFF } from "@/lib/staff-session";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";
import { ContentForm } from "@/features/content/ContentForm";

export function ContentFormScreen({ id }: { id?: string }) {
  const router = useRouter();
  const canWrite = can(STUB_STAFF.role, "content.write");
  const isEdit = Boolean(id);

  // Route guard: a role without content.write is redirected to the list (done in an effect, the
  // supported place for navigation side effects). The body renders nothing meaningful while it leaves.
  React.useEffect(() => {
    if (!canWrite) router.replace("/content");
  }, [canWrite, router]);

  const itemQuery = useQuery({
    queryKey: ["content", id],
    // Load the single item from the full list (the mock seam returns the list; a real api would have a
    // by-id read). Enabled only in edit mode and for an authorized role.
    queryFn: async () => {
      const all = await adminApi.getContent();
      return all.find((item) => item.id === id) ?? null;
    },
    enabled: isEdit && canWrite,
  });

  if (!canWrite) return null;

  const item = itemQuery.data ?? undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/content"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to content
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {isEdit ? "Edit content" : "New content"}
        </h1>
      </header>

      <PreProductionBanner />

      {isEdit && itemQuery.isLoading ? (
        <Card>
          <div
            className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Loading
          </div>
        </Card>
      ) : isEdit && !item ? (
        <EmptyState
          title="Content not found"
          description="This content item does not exist or has been removed."
          actionLabel="Back to content"
          onAction={() => router.push("/content")}
        />
      ) : (
        <ContentForm item={item} />
      )}
    </div>
  );
}
