# Spendwise API (`apps/api`)

Hono service and Drizzle journal. Money rules live in [`packages/domain`](../../packages/domain).

```bash
# from the repo root
docker compose up -d postgres
cp apps/api/.env.example apps/api/.env
npm install
npm run db:migrate
npm run dev:api
```

`GET /health` returns `{ "ok": true }` once Postgres is reachable.

After changing `src/db/schema.ts`, generate a named SQL file (drizzle-kit otherwise picks a random label):

```bash
npm run db:generate -w apps/api -- journal_schema
npm run db:migrate
```
