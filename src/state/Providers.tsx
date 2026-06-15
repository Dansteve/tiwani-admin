"use client";

// The single client-provider tree, wrapped once at the root layout. The admin foundation needs two:
// the theme controller (light / dark) and TanStack Query (server state, which currently reads the
// mock-backed admin-api client). No auth/session provider here: the staff gate is enforced SERVER-side
// in middleware.ts (Decisions.md D16), and the stub session is a cookie, not client state.

import type { ReactNode } from "react";

import { ThemeProvider } from "@/state/ThemeProvider";
import { QueryProvider } from "@/state/QueryProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
