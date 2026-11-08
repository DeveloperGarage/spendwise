import { serve } from "@hono/node-server";

import { createApp } from "./app.ts";
import { createDb } from "./db/client.ts";

const url = process.env.DATABASE_URL ?? "postgres://spendwise:spendwise@localhost:5432/spendwise";
const port = Number(process.env.PORT ?? 3000);
const { db, sql } = createDb(url);
const app = createApp(db);

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`spendwise api listening on ${port}`);
});

async function shutdown() {
  await sql.end({ timeout: 5 });
  server.close();
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
