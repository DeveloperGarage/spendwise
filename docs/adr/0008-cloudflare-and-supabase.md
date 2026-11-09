# 0008. Cloudflare and Supabase host the beta

Status: Accepted
Date: 2026-11-08
Amended: 2026-11-09 (identity is Google OAuth with an email allowlist; Phase 1 is a web PWA, no APK)

## Context

[0005](0005-server-is-the-only-writer.md) left the API host and the identity provider as deploy-time choices. It did not leave the writer, the journal, or the session shape open. The beta still needs a public HTTPS origin for the Expo web PWA, a place to run Hono, managed PostgreSQL, and a way to sign in a known group. There is no native store listing in Phase 1 ([0004](0004-expo-including-web.md)).

The group is in India. The number of platforms should stay small. A BaaS where the browser writes expenses would replace [0005](0005-server-is-the-only-writer.md). Cloudflare Access would sit in front of the URL and is not a user directory for PWA sessions.

Magic-link email was the first identity sketch. The group already has Google accounts. Pre-creating rows in the Supabase Authentication Users UI is not a reliable Google-OAuth gate: that screen often makes password users, and a later Google login can duplicate the account.

## Decision

Phase 1 runs on two platforms.

| Need | Choice |
| --- | --- |
| Expo web PWA and Hono API | One Cloudflare Worker. Static assets are the web export (manifest included). Hono is mounted at `/api`. |
| PostgreSQL | Supabase, region `ap-south-1` (Mumbai). Drizzle uses `pg` through Hyperdrive, against the direct connection string. |
| Identity | Supabase Auth, Google OAuth only. Email/password and magic link stay off. |
| Who may sign in | `allowed_emails` in the journal database. A Before User Created hook rejects any Google account whose email is not on that table. `auth.users` is created on first successful Google login, not by typing people into the Auth Users UI. |
| Opaque session | Hono. `sessions` in the journal database. httpOnly Secure cookie on the Worker origin, as in [the API](../api.md). |

The Worker is one origin. The browser and the installed PWA load the web build from it and call `/api` on the same host, so the cookie does not cross a site.

`apps/api` is Hono. Local development and the Phase 1 tests run on Node LTS against Postgres. Production is the Workers runtime. That is a host change, not a second API.

The allowlisted address must be the Google account the person will tap. `aman@company.com` on the list does not admit `aman@gmail.com`.

Do not disable sign-ups globally in Supabase Auth. That blocks OAuth from creating the first `auth.users` row for an allowed person. Hono also checks `allowed_emails` before writing `public.users` and the opaque session.

The web OAuth callback (`GET /api/auth/callback`) creates `public.users` if needed, prefills `displayName` from the Google profile, writes the opaque session, and sets the cookie. `GET /me` reports `profileCompleted: false` until the person confirms or edits that name with `PATCH /me`. The Expo web app may talk to Google and to Supabase Auth for that login. It does not ship journal writes through `supabase-js`. Membership and money writes stay in Hono, inside one Drizzle transaction.

Cloudflare Access is not the login. A later extra provider, if any, is enabled on Supabase Auth, still gated by the same allowlist, and still ends in the same Hono session.

## Consequences

- Adding a third host for the API, the web build, the database, or identity means replacing this record.
- Pointing the Expo app at Supabase for expenses, settlements, or memberships means replacing [0005](0005-server-is-the-only-writer.md).
- Drizzle connects as a trusted server role and does not rely on Supabase RLS. Group access is still checked in the API, on every group route.
- Hyperdrive is the pooler. The Worker does not stack Supabase's pooler in front of it. The driver is `pg`, so a money write can `BEGIN` and `COMMIT`.
- A Cloudflare Cron keeps the free Supabase project from pausing after seven idle days. That ping is operations, not a product feature.
- Free-plan CPU time on Workers is 10 ms per request. Waiting on Postgres does not count. Hitting that limit is an upgrade of the same Worker, not a move to another host.
- There is no Phase 1 APK, TestFlight build, or public store. Native clients, if they arrive, are a later record and still call this same `/api`.
- Site URL and Redirect URLs on Supabase Auth must include the Worker origin, or production Google login bounces to localhost.
- Google Cloud's OAuth client in Testing, with the same emails as test users, is an optional extra gate. It does not replace the hook.
