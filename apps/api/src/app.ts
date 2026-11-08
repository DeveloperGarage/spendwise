import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { requestId } from "hono/request-id";

import type { Database } from "./db/client.ts";

export type AppEnv = {
  Variables: {
    db: Database;
  };
};

export function createApp(db: Database) {
  const app = new Hono<AppEnv>();

  app.use("*", requestId());
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.get("/health", async (c) => {
    await db.execute(sql`select 1`);
    return c.json({ ok: true });
  });

  return app;
}
