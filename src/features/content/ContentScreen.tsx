"use client";

// The Content module screen: the board-ready managed-content surface. A header with a "New content" CTA
// (the coral accent, used sparingly) and two tabs: Content (the managed platform-content list) and
// Waitlist (the E1 lowest-sensitivity operational view). The data-source banner is in the (admin) layout,
// so it is not repeated here. It reads through the adminApi seam via TanStack Query (mock today; an
// audited admin-api tomorrow, only the client body changes). WRITES are gated on the RBAC scaffold:
// can(role, "content.write") shows the create / edit / publish controls, otherwise the list renders
// read-only with a calm note (the stub role is role_admin, which has the grant, so the demo shows the
// full write surface).
//
// The role comes from the stub staff session (STUB_STAFF, the same pattern the Settings screen uses);
// it is the affordance decision only, never the security boundary (real enforcement is server-side in the
// audited admin-api, Decisions.md D16). An optional `role` prop lets a test drive both roles.

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Info } from "lucide-react";

import { adminApi } from "@/lib/admin-api/client";
import { can, type StaffRole } from "@/lib/rbac";
import { STUB_STAFF } from "@/lib/staff-session";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { TabsList, TabPanel } from "@/components/ui/tabs";
import { ContentTable } from "@/features/content/ContentTable";
import { WaitlistPanel } from "@/features/content/WaitlistPanel";

const TABS = [
  { value: "content", label: "Content" },
  { value: "waitlist", label: "Waitlist" },
] as const;

export function ContentScreen({ role = STUB_STAFF.role }: { role?: StaffRole }) {
  const [tab, setTab] = React.useState<string>("content");

  const canWriteContent = can(role, "content.write");
  const canManageWaitlist = can(role, "waitlist.manage");

  const content = useQuery({ queryKey: ["content"], queryFn: () => adminApi.getContent() });
  const waitlist = useQuery({ queryKey: ["waitlist"], queryFn: () => adminApi.getWaitlist() });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Content</h1>
          <p className="text-sm text-muted-foreground">
            Manage platform content (strategies, resources, announcements) and the waitlist. Synthetic
            data, for layout and review only.
          </p>
        </div>
        {canWriteContent ? (
          // The primary CTA uses the coral brand accent (used sparingly, per Brand.md), from the
          // bg-tiwani-coral token (never a raw hex). text-white is on coral for AA contrast. The Button
          // primitive is a plain <button> (no asChild slot), so the Link is styled with buttonVariants.
          <Link
            href="/content/new"
            className={cn(
              buttonVariants(),
              "shrink-0 bg-tiwani-coral text-white hover:bg-tiwani-coral-deep",
            )}
          >
            <Plus aria-hidden="true" />
            New content
          </Link>
        ) : null}
      </header>

      {!canWriteContent ? (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            Your role cannot edit content. You can view the list, but creating, publishing, and archiving
            are reserved for an administrator.
          </AlertDescription>
        </Alert>
      ) : null}

      <TabsList
        tabs={TABS}
        value={tab}
        onValueChange={setTab}
        label="Content sections"
        idBase="content"
      />

      {tab === "content" ? (
        <TabPanel value="content" idBase="content">
          <ContentTable
            items={content.data ?? []}
            isLoading={content.isLoading}
            writeEnabled={canWriteContent}
          />
        </TabPanel>
      ) : (
        <TabPanel value="waitlist" idBase="content">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              The waitlist is the lowest-sensitivity operational surface: a public signup, an email and a
              care context, with no family data behind it.
            </p>
            <WaitlistPanel
              entries={waitlist.data ?? []}
              isLoading={waitlist.isLoading}
              canManage={canManageWaitlist}
            />
          </div>
        </TabPanel>
      )}
    </div>
  );
}
