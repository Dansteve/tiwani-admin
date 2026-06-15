"use client";

import * as React from "react";

import type { StaffRole } from "@/lib/rbac";

// The role the Users module evaluates its affordances against. In production this is the REAL role from
// the validated staff session, and there is no switching it from the UI. Pre-production there is no real
// staff auth (Decisions.md D16), so the screen wraps its subtree in this context and lets a clearly-labelled
// "Preview as role" control change it, ONLY so the board can SEE the affordances change per role. It is a
// presentation override, never a privilege grant: real enforcement lives server-side in the admin-api.

const PreviewRoleContext = React.createContext<StaffRole | null>(null);

export function PreviewRoleProvider({
  role,
  children,
}: {
  role: StaffRole;
  children: React.ReactNode;
}) {
  return (
    <PreviewRoleContext.Provider value={role}>
      {children}
    </PreviewRoleContext.Provider>
  );
}

/** The role the current Users subtree is being viewed as. Throws if used outside the provider. */
export function usePreviewRole(): StaffRole {
  const role = React.useContext(PreviewRoleContext);
  if (!role) {
    throw new Error("usePreviewRole must be used within a PreviewRoleProvider");
  }
  return role;
}
