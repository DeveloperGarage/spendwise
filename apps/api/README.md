# Spendwise API (`apps/api`)

Hono service and Drizzle journal. Money rules live in [`packages/domain`](../../packages/domain). Production is one Cloudflare Worker with the Expo web build; Postgres and magic-link email are Supabase ([`docs/adr/0008-cloudflare-and-supabase.md`](../../docs/adr/0008-cloudflare-and-supabase.md)). On that Worker this app is mounted at `/api`.

```bash
# from the repo root
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
npm install
npm run db:migrate
npm run dev:api
```

`GET /health` returns `{ "ok": true }` once Postgres is reachable. On the Worker that path is `GET /api/health`.

After changing `src/db/schema.ts`, generate a named SQL file (drizzle-kit otherwise picks a random label):

```bash
npm run db:generate -w apps/api -- journal_schema
npm run db:migrate
```
