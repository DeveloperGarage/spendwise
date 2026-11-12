import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { DATABASE_URL } from "./available.ts";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "../../drizzle");

/** Stable int4 key so parallel test files cannot apply the journal at once. */
const MIGRATE_LOCK = 87251101;

export async function migrateJournal() {
  const client = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  const db = drizzle(client);
  try {
    await client`select pg_advisory_lock(${MIGRATE_LOCK})`;
    try {
      await migrate(db, { migrationsFolder });
    } finally {
      await client`select pg_advisory_unlock(${MIGRATE_LOCK})`;
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}
