"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { adminApi } from "@/lib/admin-api/client";
import { RoleBadge } from "@/features/settings/RoleBadge";

// The staff list: a small READ-ONLY table of staff members with their role Badges. Reads through the
// admin-api seam (adminApi.getStaff -> mock today, a staff.manage-gated, audit-logged RPC tomorrow). No
// family-user data is here; these are staff members. No row actions: editing a staff member or changing a
// role is a role.manage operation handled by the (stubbed) role-management card, not an inline control.

export function StaffListCard() {
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => adminApi.getStaff() });
  const rows = staff.data ?? [];

  return (
    <Card>
      <CardHeader className="items-start gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Users className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg">Staff</CardTitle>
          <CardDescription className="text-base">
            Everyone with back-office access and their role. Read-only here; changes are a role-admin
            action (stub, below). Synthetic list.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No staff yet"
            description="Staff members will appear here once the back office has accounts."
          />
        )}
      </CardContent>
    </Card>
  );
}
