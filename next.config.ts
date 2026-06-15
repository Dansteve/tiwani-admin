import type { NextConfig } from "next";

// DELIBERATE DEPARTURE from tiwani-app (Decisions.md D16): NO `output: 'export'`.
// tiwani-app is a static export (a public, auth-gated thin client). The admin is the opposite: staff
// read ACROSS tenants, so the staff-auth gate MUST run server-side and no privileged data may ship in a
// static bundle. This app is therefore a standard SSR Next build (the runtime gate lives in middleware.ts
// + the (admin) layout), deployed to a SERVER runtime (Firebase web frameworks / Cloud Run), never to
// plain static hosting.
const nextConfig: NextConfig = {
  /* Standard SSR config. No `output` key, so Next builds the server runtime. */
};

export default nextConfig;
