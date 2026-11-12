import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { Schema } from "./client.ts";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export async function migrateJournal(db: PostgresJsDatabase<Schema>) {
  await migrate(db, { migrationsFolder });
}
