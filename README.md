# tiwani-admin

The TIWANI staff back office (internal admin). A separate, hardened, least-privilege surface for the small team to manage core platform operations: content, users (support views), platform settings, and basic reporting.

> **Status: pre-production foundation.** Everything renders against a clearly-labeled **mock data layer** (`src/lib/mock/*`). There is **no connection to real user data**, no Supabase service-role key, and no family-auth session in this app. Pointing the admin at real data is **hard-gated** behind the launch gates below (`governance/Docs/Decisions.md` D16).

## Why this is a separate app (D16)

The family product (`tiwani-app` / `tiwani-api`) enforces strict per-tenant isolation: every user sees only their own data, backed by Supabase Row Level Security. Staff, by definition, read **across** tenants, which **inverts** that boundary. So the back office is not an `/admin` route bolted onto the family app: it is a separate origin, a separate auth audience, and (when it lands) a separate API process that is the only thing ever holding the RLS-bypass credential. The accountability control that replaces RLS is an append-only, reason-required audit log on every privileged read.

## Stack

Mirrors the family app's design system so the two read as one product, with TIWANI brand tokens (Deep Teal / Coral / Warm Grey), and adopts the Blackbird-style admin-dashboard patterns from the AccountMaster reference (data tables, KPI cards, charts).

- **Next.js 16 (App Router) + React 19 + TypeScript (strict)**
- **Tailwind v4 + shadcn/ui** primitives, TIWANI brand tokens in `src/styles/theme.css`
- **TanStack Query** for server state; **Inter** via `next/font`
- **SSR (not a static export)** + a `middleware` staff-auth gate, so access is gated server-side
- **Vitest + React Testing Library** for tests

## Architecture

- `src/middleware.ts` - the server-side staff-auth gate. Every route redirects to `/login` without a staff session. This is the reason the app is SSR, not static: no privileged surface ships to an unauthenticated browser.
- `src/lib/staff-session.ts` - the staff session (a **stub** today; the real gate validates a separate-audience, MFA-asserted staff token, never the family Supabase Auth).
- `src/lib/rbac.ts` - a default-deny capability allowlist (roles `support_read` / `dsar_handler` / `role_admin`, fail-closed, no single role both reads records and grants access). Decides which affordances to show; real enforcement lives in the future admin-api.
- `src/lib/admin-api/client.ts` - the single typed client to the future `tiwani-admin-api`. Today it delegates to the mock adapters; when the audited service exists, only this client's bodies change.
- `src/lib/mock/*` - synthetic, field-minimised data. Obviously fake. Never real PII.
- `src/components/` - the admin shell, shared brand widgets, and `ui/` primitives.
- `src/features/*` - feature-first modules (dashboard, auth, users, content, reporting, settings).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 -> redirects to /login (any credentials work in the stub)
npm run typecheck  # strict tsc
npm run lint
npm run test       # vitest
npm run build      # SSR production build
```

## Deployment

This app is a **server runtime** (SSR + middleware), so it is **not** a Firebase static export.

- **Preview (mock data only):** Firebase **web frameworks** (a server runtime on Cloud Functions/Run, which still runs the staff gate server-side), to a dedicated hosting site `tiwani-admin` under the `app-tiwani` project:
  ```bash
  firebase experiments:enable webframeworks
  firebase deploy --only hosting:admin
  ```
- **Production (real data):** a restricted server origin per D16, ideally **Cloud Run behind a load balancer + IAP + IP allowlist**, with staff SSO + mandatory MFA. A Firebase custom domain can front the Cloud Run service if a `*.web.app`/custom URL is wanted.

**No deploy happens** until the owner explicitly approves that platform **and** the launch gates below clear. Every deploy is its own explicit go/no-go.

## Launch gates (hard-block touching real user data) - D16

1. **Rotate** the leaked Supabase service-role key first (the admin is its biggest blast-radius amplifier).
2. **DPIA** (an "internal staff / cross-tenant access" workstream folded into the main DPIA), external-DPO reviewed, ICO registration active.
3. **RBAC + mandatory MFA + a tamper-evident append-only audit log**, all fail-closed, built.
4. **Pen test** extended to the admin origin + the privilege boundary, post-rotation.
5. **Real-Postgres tests** (fresh throwaway DB) for the admin authz boundary + the append-only audit log.

## Red lines (designed into the UI from day one)

No standing un-purposed whole-population browse (search-first); field-minimised default views; the full sensitive record behind a higher-privilege, reason-required, separately-logged action; show that a `context_note` exists, never its contents, without a recorded reason; no single-actor erasure or bulk export (maker-checker); no "log in as user" impersonation; a visible reason/ticket field as the audit affordance on every privileged action; reporting is aggregate-only.
