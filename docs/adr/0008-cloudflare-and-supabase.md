# 0008. Cloudflare and Supabase host the beta

Status: Accepted
Date: 2026-11-08

## Context

[0005](0005-server-is-the-only-writer.md) left the API host and the mailer as deploy-time choices. It did not leave the writer, the journal, or the session shape open. The beta still needs a public HTTPS origin for the Expo web build, a place to run Hono, managed PostgreSQL, and a way to send the magic-link email. The Android APK is an internal GitHub Actions artifact. It does not need a store or a download host.

The group is in India. The number of platforms should stay small. A BaaS where the phone writes expenses would replace [0005](0005-server-is-the-only-writer.md). Cloudflare Access would sit in front of the URL and is not a user directory for Android and Safari sessions.

## Decision

Phase 1 runs on two platforms.

| Need | Choice |
| --- | --- |
| Expo web and Hono API | One Cloudflare Worker. Static assets are the web export. Hono is mounted at `/api`. |
| PostgreSQL | Supabase, region `ap-south-1` (Mumbai). Drizzle uses `pg` through Hyperdrive, against the direct connection string. |
| Magic-link email and identity | Supabase Auth. Passwords and social OAuth stay off. |
| Opaque session | Hono. `sessions` in the journal database. Web cookie and native bearer, as in [the API](../api.md). |
| Android APK | GitHub Actions internal build. |

The Worker is one origin. Safari loads the web build from it and calls `/api` on the same host, so the httpOnly Secure cookie does not cross a site. Android calls the same `/api` routes with `Authorization: Bearer`.

`apps/api` is Hono. Local development and the Phase 1 tests run on Node LTS against Postgres. Production is the Workers runtime. That is a host change, not a second API.

Supabase Auth sends the email and holds `auth.users`. The first successful `POST /api/auth/sessions` creates `public.users` if needed, then writes the opaque session. The Expo app does not ship `supabase-js` and does not write journal tables. Membership and money writes stay in Hono, inside one Drizzle transaction.

The magic-link URL opens Spendwise. Redeem is `POST /api/auth/sessions`. A GET must not consume the token.

Cloudflare Access is not the login. A later social provider, if any, is enabled on Supabase Auth and still ends in the same Hono session.

## Consequences

- Adding a third host for the API, the web build, the database, or the mailer means replacing this record.
- Pointing the Expo app at Supabase for expenses, settlements, or memberships means replacing [0005](0005-server-is-the-only-writer.md).
- Drizzle connects as a trusted server role and does not rely on Supabase RLS. Group access is still checked in the API, on every group route.
- Hyperdrive is the pooler. The Worker does not stack Supabase's pooler in front of it. The driver is `pg`, so a money write can `BEGIN` and `COMMIT`.
- A Cloudflare Cron keeps the free Supabase project from pausing after seven idle days. That ping is operations, not a product feature.
- Free-plan CPU time on Workers is 10 ms per request. Waiting on Postgres does not count. Hitting that limit is an upgrade of the same Worker, not a move to another host.
- The APK remains a GitHub artifact. TestFlight and a public store are still out of the beta, as in [0004](0004-expo-including-web.md).
