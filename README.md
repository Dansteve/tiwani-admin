# tiwani-admin

**TIWANI Admin** (the product UI name; "back office" is the descriptive role). A separate, hardened, least-privilege surface for the small team to manage core platform operations: content, users (support views), platform settings, and basic reporting. The repo and code names stay `tiwani-admin`.

> **Status: pre-production foundation.** Everything renders against a clearly-labeled **mock data layer** (`src/lib/mock/*`) by **default**. A **data-source toggle** (MOCK / LIVE, in the banner on every page, gated to a `roles.manage` role) can flip the seam to the live admin-api (`NEXT_PUBLIC_ADMIN_API_URL`) for a demo; the admin-api carries only `/health` today, so a live read of a data endpoint surfaces a clean empty state plus a toast, and **mock stays the default**. There is **no connection to real user data**, no Supabase service-role key, and no family-auth session in this app. Pointing the admin at real data is **hard-gated** behind the launch gates below (`governance/Docs/Decisions.md` D16).

## Why this is a separate app (D16)

The family product (`tiwani-app` / `tiwani-api`) enforces strict per-tenant isolation: every user sees only their own data, backed by Supabase Row Level Security. Staff, by definition, read **across** tenants, which **inverts** that boundary. So the back office is not an `/admin` route bolted onto the family app: it is a separate origin, a separate auth audience, and (when it lands) a separate API process that is the only thing ever holding the RLS-bypass credential. The accountability control that replaces RLS is an append-only, reason-required audit log on every privileged read.

## Stack

Mirrors the family app's design system so the two read as one product, with TIWANI brand tokens (Deep Teal / Coral / Warm Grey), and adopts the Blackbird-style admin-dashboard patterns from the AccountMaster reference (data tables, KPI cards, charts).

- **Next.js 16 (App Router) + React 19 + TypeScript (strict)**
- **Tailwind v4 + shadcn/ui** primitives, TIWANI brand tokens in `src/styles/theme.css`
- **TanStack Query** for server state; **Inter** via `next/font`
- **Recharts** (token-themed via the chart wrapper) for the dashboard charts; **sonner** for toasts
- **SSR by default** (the production posture) + a `middleware` staff-auth gate, so access is gated server-side. A **static-export build VARIANT** (`npm run build:static`, behind `STATIC_EXPORT=1`) produces a fully static `out/` for a mock-data demo on Firebase Hosting without Cloud Functions; under that variant a client guard replaces the middleware and role resolution + the stub sign-in run client-side. Mock stays the default, the live toggle still works, and nothing real is exposed (D16). See Deployment.
- **Vitest + React Testing Library** for tests

## Architecture

- `src/middleware.ts` - the server-side staff-auth gate (the SSR build). Every route redirects to `/login` without a staff session. This is the production posture: no privileged surface ships to an unauthenticated browser. Next disables middleware under `output: "export"`, so on the static-demo variant the gate is `src/components/StaffSessionGuard.tsx` instead (see below).
- `src/components/StaffSessionGuard.tsx` - the **client** staff-session gate, mounted once in the `(admin)` layout. On mount it checks the staff session cookie and `router.replace("/login")` if absent. It is the gate on the static-export build (where middleware does not run) and a harmless second check under SSR.
- `src/lib/staff-session.ts` - the staff session (a **stub** today; the real gate validates a separate-audience, MFA-asserted staff token, never the family Supabase Auth). Carries the one encode/decode codec plus the browser cookie helpers (`readStaffSessionFromDocument` / `writeStaffSessionToDocument` / `clearStaffSessionFromDocument`) the static-export sign-in / gate use (no server action under export).
- `src/lib/use-staff-session.ts` - the **client** hooks `useStaffSession()` / `useStaffRole()` that resolve the stub session from the cookie (falling back to `STUB_STAFF`), so the `(admin)` layout and the settings page no longer read `cookies()` server-side and the whole tree is static-exportable. The `roles.manage` gating stays intact (resolved client-side).
- `src/lib/rbac.ts` - a default-deny capability allowlist (roles `support_read` / `dsar_handler` / `role_admin`, fail-closed, no single role both reads records and grants access; plus `super_admin`, the bootstrap sole-operator that consolidates every duty for now, the one deliberate exception, with the accountability controls still binding it). Decides which affordances to show; real enforcement lives in the future admin-api. The bootstrap super admin is `dansteveadekanbi@gmail.com` (`SUPER_ADMIN_EMAIL`). How staff are added is documented in [docs/STAFF.md](docs/STAFF.md): staff are provisioned (invited by email + a role), never self-register.
- `src/lib/admin-api/client.ts` - the single typed client to the future `tiwani-admin-api`. Each read goes through a reusable `seam(mockFn, path)` wrapper that branches on the data-source mode: `"mock"` (the default) returns the mock adapter; `"live"` issues a `fetch` against `NEXT_PUBLIC_ADMIN_API_URL` via `liveGet<T>` (which throws a clear "Live API not configured" error if the URL is unset, and `LiveEndpointUnavailableError` on a 404, since the data endpoints are not built yet). When the audited service exists, only the live branch of this client changes. A new method adopts the mock/live behaviour by wrapping its mock call the same way.
- `src/lib/admin-api/mode.ts` - the data-source mode model (`"mock" | "live"`, default `"mock"`, persisted to `localStorage` key `tiwani.admin.datasource.v1`) plus the module-level current-mode store (`getDataMode()` / `setDataMode()`) the seam reads. `src/state/DataSourceProvider.tsx` is the React controller (a `useDataSource()` hook, mirroring `ThemeProvider`) that keeps the store in sync and invalidates the query cache on a flip; `src/features/dashboard/PreProductionBanner.tsx` is the mode-aware banner + the `roles.manage`-gated MOCK/LIVE toggle, rendered once in the `(admin)` layout.
- `src/lib/mock/*` - synthetic, field-minimised data. Obviously fake. Never real PII. The dashboard data (`metrics.ts`) is aggregate-only (counts, no identified individuals).
- `src/components/ui/*` - the shadcn/Radix primitives, all themed to TIWANI tokens (no off-brand hex): `button`, `card`, `input`, `label`, `field`, `tabs`, `alert`, plus the ported admin-dashboard layer `table` (with a `numeric` right-align prop), `table-pagination`, `badge` (default/secondary/outline/destructive/success/warning), `select`, `tooltip`, `dropdown-menu`, `separator`, and `chart` (the recharts wrapper that injects `--color-<key>` from the `--chart-1..5` token ramp).
- `src/lib/chart.ts` - the shared chart helpers (the token series ramp, the short animation budget, the grid/axis defaults, the gradient + empty-state helpers). No hardcoded hex; no finance semantics.
- `src/components/` - the admin shell and the shared brand widgets: `EmptyState` (the reusable no-data state), `DataTable` (the GENERIC, reusable admin table the Users/Content modules build on: a controlled search box, **search-first** mode that requires a query before any row renders per the DPO cross-tenant red line, typed column config, client-side filter + pagination, loading + empty states), and `Toaster` (sonner, themed to the brand surface).
- `src/features/*` - feature-first modules (dashboard, auth, users, content, blog, reporting, settings). The dashboard is board-ready and aggregate-only: a KPI row (`KpiCard`), an aggregate signup-trend chart (`SignupTrendChart`), and a recent-activity table (`ActivityPanel`). The blog module is the staff blog-authoring surface; how a published post reaches the public website is documented in [docs/BLOG.md](docs/BLOG.md). The `auth` module's stub sign-in / sign-out are **client-side** (they set / clear the stub session cookie in the browser and navigate), so the same flow works under both builds (a server action is incompatible with `output: "export"`); the real separate-audience IdP + server-set session lands before any real data (D16).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 -> redirects to /login (any credentials work in the stub)
npm run typecheck  # strict tsc
npm run lint
npm run test         # vitest
npm run build        # SSR production build (the production posture: server runtime + middleware gate)
npm run build:static # STATIC_EXPORT=1 next build -> a fully static out/ (the mock-data demo build)
```

## Deployment

The app has two build postures. `firebase.json` is committed as the **static-demo** config (`public: "out"`, no `frameworksBackend`); the prior SSR / web-frameworks config is recorded below so the Cloud Run / Blaze path is not lost.

### Static-demo build (current `firebase.json`) - mock data, no Cloud Functions, no billing

`npm run build:static` (`STATIC_EXPORT=1 next build`) emits a complete static `out/` (every page plus the `new` / seed `edit` routes). It deploys to Firebase Hosting WITHOUT Cloud Functions, so it needs no Blaze billing. It is a demo VARIANT, not a posture change: mock is still the default, the live data-source toggle still works client-side, and nothing real is exposed (D16 still hard-gates real data). Under the export Next disables middleware, so the gate is the client `StaffSessionGuard`; role resolution and the stub sign-in run client-side. `firebase.json` keeps the site `noindex` (an `X-Robots-Tag` header) and rewrites the dynamic edit routes (`/content/*/edit`, `/blog/*/edit`) to a seed html shell so a demo-created id deep-links (the client reads the real id from the URL via `useParams`).

```bash
npm run build:static
firebase deploy --only hosting:admin   # uploads out/ to the `admin` hosting target
```

### SSR / web-frameworks build (preserved for the production path) - NOT the current `firebase.json`

The production posture is a **server runtime** (SSR + middleware), so the gate runs server-side and no privileged surface ships pre-authenticated. The previous `firebase.json` for this was:

```jsonc
{
  "hosting": {
    "target": "admin",
    "source": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "frameworksBackend": { "region": "us-central1" }
  }
}
```

- **Preview (mock data only):** Firebase **web frameworks** (a server runtime on Cloud Functions/Run, which still runs the staff gate server-side), to a dedicated hosting site under the `app-tiwani` project. Restore the `frameworksBackend` config above, then:
  ```bash
  firebase experiments:enable webframeworks
  firebase deploy --only hosting:admin
  ```
- **Production (real data):** a restricted server origin per D16, ideally **Cloud Run behind a load balancer + IAP + IP allowlist**, with staff SSO + mandatory MFA. A Firebase custom domain can front the Cloud Run service if a `*.web.app`/custom URL is wanted.

**No deploy happens** until the owner explicitly approves that platform **and** the launch gates below clear. Every deploy is its own explicit go/no-go. The static-demo build above is **mock-data only**; the SSR / Cloud Run path is what production (real data) uses.

## Launch gates (hard-block touching real user data) - D16

1. **Rotate** the leaked Supabase service-role key first (the admin is its biggest blast-radius amplifier).
2. **DPIA** (an "internal staff / cross-tenant access" workstream folded into the main DPIA), external-DPO reviewed, ICO registration active.
3. **RBAC + mandatory MFA + a tamper-evident append-only audit log**, all fail-closed, built.
4. **Pen test** extended to the admin origin + the privilege boundary, post-rotation.
5. **Real-Postgres tests** (fresh throwaway DB) for the admin authz boundary + the append-only audit log.

## Red lines (designed into the UI from day one)

No standing un-purposed whole-population browse (search-first); field-minimised default views; the full sensitive record behind a higher-privilege, reason-required, separately-logged action; show that a `context_note` exists, never its contents, without a recorded reason; no single-actor erasure or bulk export (maker-checker); no "log in as user" impersonation; a visible reason/ticket field as the audit affordance on every privileged action; reporting is aggregate-only.
