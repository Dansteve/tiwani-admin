"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api/client";
import { STUB_STAFF } from "@/lib/staff-session";
import type { StaffRole } from "@/lib/rbac";
import type { AdminUserSummary } from "@/lib/mock/users";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { PreProductionBanner } from "@/features/dashboard/PreProductionBanner";

import { PreviewRoleProvider } from "@/features/users/roleContext";
import { RolePreview } from "@/features/users/RolePreview";
import { UserDetailDialog } from "@/features/users/UserDetailDialog";
import { StatusBadge, PlanBadge } from "@/features/users/userBadges";

// The Users support view (E2). A SEARCH-FIRST, FIELD-MINIMISED support surface (Decisions.md D16, the DPO
// red lines): nothing lists until the staff member searches (no standing whole-population browse), and the
// columns are the minimised summary only (display name, email, status, plan, recipient COUNT, joined),
// never the sensitive record. A row opens the minimised detail surface, from which the full record is a
// separate, higher-privilege, reason-required, separately-logged reveal (UserDetailDialog).
//
// The previewed role: the real role comes from the (stub) staff session. STUB_STAFF.role is role_admin,
// which by design cannot read records at all, so for the demo the screen starts the preview at the
// least-privilege SUPPORT role (support_read) and the board can switch to dsar_handler to watch the reveal
// affordance appear. The switch is a clearly-labelled pre-production stub (RolePreview), not a real grant.

/** The role the preview starts on: a record-reading support role, so the support view is usable to demo. */
function initialPreviewRole(): StaffRole {
  // If the stub session already carries a record-reading role, honour it; otherwise default to the
  // least-privilege support role so the minimised list is visible for review.
  return STUB_STAFF.role === "dsar_handler" ? "dsar_handler" : "support_read";
}

const columns: DataTableColumn<AdminUserSummary>[] = [
  {
    id: "name",
    header: "Coordinator",
    cell: (u) => <span className="font-medium text-foreground">{u.displayName}</span>,
    searchValue: (u) => u.displayName,
  },
  {
    id: "email",
    header: "Email",
    cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
    searchValue: (u) => u.email,
  },
  {
    id: "status",
    header: "Status",
    cell: (u) => <StatusBadge status={u.status} />,
  },
  {
    id: "plan",
    header: "Plan",
    cell: (u) => <PlanBadge planTier={u.planTier} />,
  },
  {
    id: "recipients",
    header: "Recipients",
    numeric: true,
    cell: (u) => u.recipientCount,
  },
  {
    id: "joined",
    header: "Joined",
    cell: (u) => <span className="text-muted-foreground">{u.joined}</span>,
  },
];

export function UsersScreen() {
  const [previewRole, setPreviewRole] = React.useState<StaffRole>(initialPreviewRole);
  const [selected, setSelected] = React.useState<AdminUserSummary | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const users = useQuery({ queryKey: ["users"], queryFn: () => adminApi.getUsers() });

  function openDetail(user: AdminUserSummary) {
    setSelected(user);
    setDetailOpen(true);
  }

  return (
    <PreviewRoleProvider role={previewRole}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Users</h1>
          <p className="text-sm text-muted-foreground">
            Search-first, field-minimised support view. Synthetic data.
          </p>
        </header>

        <PreProductionBanner />

        <RolePreview role={previewRole} onRoleChange={setPreviewRole} />

        <DataTable
          data={users.data ?? []}
          columns={columns}
          getRowId={(u) => u.id}
          isLoading={users.isLoading}
          searchFirst
          searchPlaceholder="Search by name or email"
          caption="Search-first, field-minimised support view. Synthetic data."
          onRowClick={openDetail}
          emptyTitle="No coordinators"
          emptyDescription="There are no synthetic records to show."
        />

        <UserDetailDialog
          user={selected}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </PreviewRoleProvider>
  );
}
