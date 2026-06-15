# Staff provisioning

How a person gets access to TIWANI Admin. This is the process, not a feature description: it explains who can add staff, how, and what is real versus pre-production today.

> **Pre-production.** Nothing here touches real data yet. The provisioning UI in Settings is a clearly-labeled stub, and the bootstrap identity is a placeholder session. The real flow lands behind the launch gates (`governance/Docs/Decisions.md` D16): key rotation, DPIA, RBAC + mandatory MFA + an append-only audit log, and a pen test.

## Staff are provisioned, never self-register

There is no sign-up for Admin. A person does not create their own staff account. Access is granted by an existing administrator who invites them by email and assigns a role. This is deliberate: staff read **across** tenants (the inverse of the family product's per-tenant isolation), so who holds access is a controlled list, not an open door.

## The roles (`src/lib/rbac.ts`)

The capability allowlist is default-deny: a role gets a capability only if it is positively listed.

- **`super_admin`** the bootstrap platform owner. For now, while TIWANI is a sole-operator, this role **consolidates every duty** (it both reads records and grants access). It is the one exception to the separation below, and it is a "for now" arrangement, not the target end-state. The accountability controls still bind it: a record read is still reason-required, audited before the data is returned, and search-first (never a standing un-audited population browse).
- **`role_admin`** administers staff and roles; does **not** read sensitive user records.
- **`dsar_handler`** handles data-rights / erasure workflows (reason-required, maker-checker); does not manage staff or roles.
- **`support_read`** read-only, field-minimised support views (the least-privilege default).

Strict separation of duties holds for the three operational roles: none of them both reads records **and** grants access. Splitting `super_admin`'s consolidated duties across separate staff is the target once the team grows, and that split must be reviewed with the DPO before Admin ever touches real data.

## The bootstrap super admin

`dansteveadekanbi@gmail.com` is the bootstrap `super_admin` for now (`SUPER_ADMIN_EMAIL` in `src/lib/rbac.ts`). It is the first staff row and the identity the stub session resolves to, so the access model can be threaded end-to-end before the real IdP exists. It is the founder's real address, intended; every other seeded staff row is synthetic (`@tiwani.internal`).

## Who can add a staff member

The "Add / invite staff member" affordance in Settings is gated by `can(role, "roles.manage")`, so only `super_admin` or `role_admin` sees the form. Everyone else sees a view-only notice. The frontend gate decides what to show; the real authorization is enforced server-side by the admin-api, not the browser.

## How to invite (today: stub)

1. Open Settings in Admin.
2. In "Add / invite staff member", enter the person's work email and pick their role.
3. Submit. Today this records nothing real: it shows a toast confirming the invite was captured as a stub. No account is created, no email is sent.

The form defaults a new invite to the least-privilege `support_read` role; a higher role is a deliberate choice.

## The real flow (behind the D16 gates)

When the gates clear, provisioning runs through:

- a **separate staff identity provider**, distinct from the family Supabase Auth audience (a distinct Supabase project, or WorkOS / Clerk), with **enforced MFA** (AAL2) at the IdP. A family JWT and a staff JWT must never share an issuer, a token, or a cookie.
- the audited **`tiwani-admin-api`**, whose `get_current_staff` dependency validates the MFA-asserted staff token. It is a **sibling** of the family api's `get_current_user`, never a flag on it, so the two auth paths cannot be confused.
- an **append-only, reason-required audit log**: every privileged read and every grant change is logged before it takes effect.

Until then, the provisioning UI is a stub and the staff session is a placeholder. Nothing real until the launch gates clear.
