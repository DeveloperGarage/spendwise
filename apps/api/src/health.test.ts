import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";

const hasPostgres = await postgresAvailable();

describe("GET /health", { skip: !hasPostgres }, () => {
  it("answers when Postgres is available", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    try {
      const app = createApp(db);
      const res = await app.request("/health");
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
