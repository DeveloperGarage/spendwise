import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import type { Database } from "./client.ts";
import * as schema from "./schema.ts";

/** One Client per Worker request. Hyperdrive holds the real pool. */
export async function withPgDb<T>(
  connectionString: string,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const db = drizzle(client, { schema });
    return await fn(db);
  } finally {
    await client.end();
  }
}
