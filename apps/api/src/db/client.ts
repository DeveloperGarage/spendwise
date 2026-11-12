import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

export function createDb(url: string) {
  const sql = postgres(url);
  return { sql, db: drizzle(sql, { schema }) };
}

export type Schema = typeof schema;
export type Database = PostgresJsDatabase<Schema> | NodePgDatabase<Schema>;
