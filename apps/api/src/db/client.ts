import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";

export function createDb(url: string) {
  const sql = postgres(url);
  return { sql, db: drizzle(sql, { schema }) };
}

export type Database = ReturnType<typeof createDb>["db"];
