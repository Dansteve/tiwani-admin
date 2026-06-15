import type { NextConfig } from "next";

// TWO BUILD POSTURES, one config (Decisions.md D16):
//
// 1. DEFAULT (`next build`, no flag): a standard SSR build. tiwani-admin is a privileged, cross-tenant
//    surface, so the staff-auth gate MUST run server-side (middleware.ts + the (admin) layout) and no
//    privileged data may ship pre-authenticated. This is the PRODUCTION posture (server runtime: Cloud
//    Run / web frameworks). `output` is undefined, so Next builds the server runtime.
//
// 2. STATIC EXPORT (`STATIC_EXPORT=1 next build`, i.e. `npm run build:static`): a fully static `out/`
//    for a MOCK-DATA demo on Firebase Hosting WITHOUT Cloud Functions (no billing). It is a build VARIANT,
//    not a posture change: mock stays the default, the live data-source toggle still works client-side, and
//    nothing real is ever exposed (D16 still hard-gates real data). Under export the server-side staff gate
//    cannot run, so a CLIENT guard (components/StaffSessionGuard.tsx) replaces the middleware, and role
//    resolution + the stub sign-in run client-side. This variant is demo-only; production stays SSR.
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Only set `output: "export"` under the flag; the default build stays SSR (no `output` key).
  output: isStaticExport ? "export" : undefined,
  // The export has no image-optimization server, so disable it under the flag (no `next/image` is used
  // today, but this keeps the export safe if one is added). SSR keeps the default optimizer.
  ...(isStaticExport ? { images: { unoptimized: true } } : {}),
};

export default nextConfig;
