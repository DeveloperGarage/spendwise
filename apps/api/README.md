# Spendwise API (`apps/api`)

Hono service and Drizzle journal. Money rules live in [`packages/domain`](../../packages/domain). Production is one Cloudflare Worker with the Expo web PWA; Postgres and Google OAuth are Supabase ([`docs/adr/0008-cloudflare-and-supabase.md`](../../docs/adr/0008-cloudflare-and-supabase.md)). On that Worker this app is mounted at `/api`.

```bash
# from the repo root
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
npm install
npm run db:migrate
npm run dev:api
```

`GET /health` returns `{ "ok": true }` once Postgres is reachable. On the Worker that path is `GET /api/health`.

## Google sign-in (local)

Fill `apps/api/.env` from `.env.example`. Enable Google on the Supabase project. Add `http://localhost:3000/auth/callback` to Redirect URLs. Seed the Google address you will tap:

```sql
insert into allowed_emails (email) values ('you@gmail.com');
```

Paste [`drizzle/supabase_before_user_created.sql`](drizzle/supabase_before_user_created.sql) into the hosted Supabase SQL editor and point **Before User Created** at `hook_restrict_signup_by_allowlist`. Do not disable Auth sign-ups globally.

Expo web (`http://localhost:8081`) calls this API with credentials. `Continue with Google` goes to `GET /auth/google`.

## Dev sign-in bypass (local only)

Use this to skip Google during development. Set `DEV_AUTH_BYPASS=true` in `apps/api/.env`, then open:

```
http://localhost:3000/auth/dev-login?email=you@gmail.com
```

The email must still be in `allowed_emails`. The route sets the session cookie and redirects to the app, the same way the Google callback does. It is not registered when the flag is off or when `NODE_ENV=production`.

After changing `src/db/schema.ts`, generate a named SQL file (drizzle-kit otherwise picks a random label):

```bash
npm run db:generate -w apps/api -- journal_schema
npm run db:migrate
```
