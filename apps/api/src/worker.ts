import { sql } from "drizzle-orm";
import { Hono } from "hono";

import { createApp } from "./app.ts";
import type { Database } from "./db/client.ts";
import { withPgDb } from "./db/pg.ts";

export type WorkerEnv = {
  HYPERDRIVE: { connectionString: string };
  APP_ORIGIN: string;
  PUBLIC_API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  COOKIE_SECURE?: string;
};

export function mountSpendwiseApi(db: Database, env: WorkerEnv) {
  const app = new Hono();
  app.route(
    "/api",
    createApp(db, {
      appOrigin: env.APP_ORIGIN,
      publicApiUrl: env.PUBLIC_API_URL,
      supabaseUrl: env.SUPABASE_URL,
      supabaseAnonKey: env.SUPABASE_ANON_KEY,
      cookieSecure: env.COOKIE_SECURE !== "false",
    }),
  );
  return app;
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return withPgDb(env.HYPERDRIVE.connectionString, async (db) =>
      mountSpendwiseApi(db, env).fetch(request),
    );
  },

  async scheduled(_controller: unknown, env: WorkerEnv): Promise<void> {
    await withPgDb(env.HYPERDRIVE.connectionString, async (db) => {
      await db.execute(sql`select 1`);
    });
  },
};
