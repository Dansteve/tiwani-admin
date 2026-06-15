"use client";

// The single client-provider tree, wrapped once at the root layout. The admin foundation needs the theme
// controller (light / dark), TanStack Query (server state, which currently reads the mock-backed
// admin-api client), the data-source controller (the MOCK <-> LIVE demo toggle), and the toast surface
// (sonner, themed to the brand tokens and following the active theme). The Toaster sits inside
// ThemeProvider so it reads the effective theme. DataSourceProvider sits INSIDE QueryProvider because it
// invalidates the query cache on a mode flip (it uses useQueryClient). No auth/session provider here: the
// staff gate is enforced SERVER-side in middleware.ts (Decisions.md D16), and the stub session is a
// cookie, not client state.

import type { ReactNode } from "react";

import { ThemeProvider } from "@/state/ThemeProvider";
import { QueryProvider } from "@/state/QueryProvider";
import { DataSourceProvider } from "@/state/DataSourceProvider";
import { Toaster } from "@/components/Toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <DataSourceProvider>{children}</DataSourceProvider>
      </QueryProvider>
      <Toaster />
    </ThemeProvider>
  );
}
