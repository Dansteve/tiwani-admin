"use client";

// The TanStack Query provider. Server state across the app is Query (reads useQuery, mutations
// useMutation); this wraps the tree once so every screen shares one QueryClient. Errors surface at the
// call site, never a swallowed catch.

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per app instance, created in state so it is stable across re-renders.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
