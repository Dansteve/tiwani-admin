# Blog

How blog content flows from the Admin (where it is authored) to the public website (where it is read). This is the seam, not just a feature description: it spells out which part is built here, which parts are deliberate follow-ups, and where each plugs in.

> **Pre-production.** Nothing here touches a database yet. The Blog module renders against the clearly-labeled mock store (`src/lib/mock/blog.ts`), the same as every other module. Persistence and the public read API land behind the launch gates (`governance/Docs/Decisions.md` D16): key rotation, DPIA, RBAC + mandatory MFA + an append-only audit log, and a pen test.

## The flow, end to end

```
  TIWANI Admin (this app)            tiwani-admin-api            tiwani-api                 tiwani-website
  ----------------------             ----------------            ----------                --------------
  Staff AUTHOR / EDIT / PUBLISH  ->  persist the post       ->   PUBLIC read API       ->  render the blog
  posts (Blog module)                (authored, audited)         GET /api/public/blog      pages + posts
                                                                 (no staff auth,
                                                                  status="published"
                                                                  only, public fields)
        [BUILT HERE]                   [FOLLOW-UP]                  [FOLLOW-UP]               [FOLLOW-UP]
```

1. **The Admin DETERMINES the content (built here).** Staff with `content.write` author, edit, and publish posts in the Blog module (`/blog`). Blog is authored editorial content (caregiving tips, product news), so it reuses the `content.write` capability rather than introducing a new one; a read-only role sees the list without the write controls. Today every read and write goes through the `adminApi` seam (`src/lib/admin-api/client.ts`) to the mutable mock store (`src/lib/mock/blog.ts`). No database, no network, no real data.
2. **`tiwani-admin-api` persists the post (follow-up).** When the audited admin-api exists, the seam's blog methods (`getBlogPosts`, `getBlogPost`, `createBlogPost`, `updateBlogPost`, `setBlogPostStatus`) stop returning the mock and instead call authorized, audit-logged admin-api endpoints. The post is stored once, by the audited service that holds the privileged credential (never this frontend).
3. **A SEPARATE PUBLIC read API serves the published posts (follow-up).** A distinct, **unauthenticated** endpoint, e.g. `GET /api/public/blog` (and `GET /api/public/blog/{slug}`) on the family `tiwani-api`, exposes **only** `status="published"` posts and **only** the public fields. It carries no staff auth and no family-user auth: it is a public content feed, the same trust level as the marketing site itself. It must never expose a draft or an internal field.
4. **`tiwani-website` renders the posts (follow-up).** The public marketing site (`tiwani-website`) reads that public API and renders the blog index + individual post pages, on-brand, with real SEO (Next SSG).

## What is built here vs the follow-ups

| Piece | Where | Status |
| --- | --- | --- |
| Blog authoring UI (list, create, edit, publish / unpublish) | `tiwani-admin` `src/features/blog/*` | **Built** (this change) |
| The mock store + the public-subset model | `tiwani-admin` `src/lib/mock/blog.ts` | **Built** (mock) |
| The admin-side seam methods | `tiwani-admin` `src/lib/admin-api/client.ts` | **Built** (mock; a parallel change wraps them with a mock/live branch) |
| Persisting authored posts | `tiwani-admin-api` | **Follow-up** (not built here) |
| The public, unauthenticated read API (`GET /api/public/blog`) | `tiwani-api` | **Follow-up** (not built here) |
| The public blog pages | `tiwani-website` | **Follow-up** (not built here) |

## The public contract: `getMockPublishedBlogPosts`

`getMockPublishedBlogPosts()` in `src/lib/mock/blog.ts` is the working model of exactly what the future public read API will expose. It is the contract the website codes against, so it is deliberately narrow:

- **Published only.** It filters to `status === "published"`. A draft is never returned. (`setBlogPostStatus(id, "draft")` pulls a post back out of the public subset; publishing puts it in.)
- **Public fields only.** It maps each post to the `PublicBlogPost` type, which omits the internal-only fields (`status`, `updatedAt`). The website receives `id`, `title`, `slug`, `excerpt`, `body`, `coverImageUrl?`, `author`, `publishedAt`, `tags?`, and nothing else.

A test (`src/features/blog/blog.test.tsx`) pins both: no draft leaks, and no internal field appears on a public post. When the real public endpoint is built, it must honour the same contract; `PublicBlogPost` is the shared shape to build it to.

## Data minimisation (why the public surface is safe)

Blog posts are staff-authored editorial content. They carry **no family-user data**: no Coordinator, no care recipient, no LCI, no Card content, nothing per-tenant. The author byline is a staff display name (e.g. "TIWANI Team"), not a family identity. So the public read API is a public content feed, not a privileged cross-tenant read, and it does not need (and must not have) the admin's privileged credential. Keep it that way: only ever expose `PublicBlogPost`, only ever for `status="published"`.
