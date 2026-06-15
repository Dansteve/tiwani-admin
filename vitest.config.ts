// Vitest configuration for tiwani-admin (mirrors tiwani-app's). Pure logic (the RBAC allowlist, the
// nav active-route test, the mock adapters) carries co-located tests; the shell + dashboard get render
// tests that assert they show the mock data and resolve to the brand tokens (no off-brand hex). jsdom is
// the environment for component tests; the "@/" alias mirrors tsconfig so imports resolve identically.

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
