import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SESSION_COOKIE } from "./auth.ts";
import type { Database } from "./db/client.ts";
import { mountSpendwiseApi } from "./worker.ts";

const env = {
  HYPERDRIVE: { connectionString: "postgres://unused" },
  APP_ORIGIN: "https://spendwise.example",
  PUBLIC_API_URL: "https://spendwise.example/api",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  COOKIE_SECURE: "true",
};

describe("Worker /api mount", () => {
  it("redirects Google OAuth through /api/auth/callback with a Secure cookie", async () => {
    const app = mountSpendwiseApi({} as Database, env);
    const res = await app.request("/api/auth/google");
    assert.equal(res.status, 302);
    const location = res.headers.get("location") ?? "";
    assert.match(location, /provider=google/);
    assert.match(
      location,
      /redirect_to=https%3A%2F%2Fspendwise\.example%2Fapi%2Fauth%2Fcallback/,
    );
    const cookie = res.headers.get("set-cookie") ?? "";
    assert.match(cookie, /Secure/i);
    assert.doesNotMatch(cookie, new RegExp(`${SESSION_COOKIE}=`));
  });

  it("does not serve the PWA from the API mount", async () => {
    const app = mountSpendwiseApi({} as Database, env);
    const res = await app.request("/");
    assert.equal(res.status, 404);
  });
});
