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

## Production Worker

One Cloudflare Worker serves the Expo web PWA and this app at `/api`. Local and CI stay Node LTS with `postgres.js`. Production uses `pg` through Hyperdrive, pointed at the **direct** Supabase connection (`db.<project>.supabase.co:5432`), not the pooler on `6543`.

1. Apply the journal to Mumbai (`DATABASE_URL` = the direct URI, then `npm run db:migrate`). Seed `allowed_emails` on that database too.
2. Create Hyperdrive with caching off so a new session is visible on the next read:

   ```bash
   npx wrangler hyperdrive create spendwise-pg \
     --connection-string "postgres://…" \
     --caching-disabled
   ```

   Paste the returned id into the single `hyperdrive` binding in `wrangler.jsonc`. Do not add a second `HYPERDRIVE` entry (`wrangler hyperdrive create` will offer to; that duplicates the name and deploy fails). Hyperdrive has no `remote` flag — local dev uses `localConnectionString`.
3. GitHub secrets: `CLOUDFLARE_API_TOKEN` (template **Edit Cloudflare Workers**), `CLOUDFLARE_ACCOUNT_ID`. The Hyperdrive id lives in `wrangler.jsonc`, not in GitHub secrets.
4. Worker secrets (not the GitHub file): `APP_ORIGIN` (`https://spendwise.<account>.workers.dev`), `PUBLIC_API_URL` (`https://spendwise.<account>.workers.dev/api`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

   ```bash
   npx wrangler secret put APP_ORIGIN
   npx wrangler secret put PUBLIC_API_URL
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_ANON_KEY
   ```

5. Supabase **Redirect URLs** must include `https://<worker-origin>/api/auth/callback` as well as localhost. Site URL can be the Worker origin. Do not put the Worker URL in Google Cloud’s authorized redirect list; that stays `https://<project>.supabase.co/auth/v1/callback`.
6. Push to `main`. GitHub Actions exports the PWA with `EXPO_PUBLIC_API_URL=/api` and deploys. There is no APK.

A daily cron hits `select 1` through Hyperdrive so the free Supabase project does not pause after seven idle days. Journal writes stay in Hono; the PWA does not use `supabase-js` for expenses.

After changing `src/db/schema.ts`, generate a named SQL file (drizzle-kit otherwise picks a random label):

```bash
npm run db:generate -w apps/api -- journal_schema
npm run db:migrate
```
