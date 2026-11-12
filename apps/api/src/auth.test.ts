import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { PKCE_COOKIE, SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import { allowedEmails, sessions, users } from "./db/schema.ts";

const hasPostgres = await postgresAvailable();

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session, "expected session cookie");
  return session.split(";", 1)[0];
}

describe("Google OAuth allowlist", { skip: !hasPostgres }, () => {
  it("creates a session for an allowlisted Google user", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `aman.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values({ email });
      const app = createApp(db, {
        cookieSecure: false,
        appOrigin: "http://localhost:8081",
        exchangeGoogle: async () => ({ email, displayName: "Aman Google" }),
      });

      const res = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake-id-token" }),
      });
      assert.equal(res.status, 201);
      const body = (await res.json()) as { user: { email: string; displayName: string; profileCompleted: boolean } };
      assert.equal(body.user.email, email);
      assert.equal(body.user.displayName, "Aman Google");
      assert.equal(body.user.profileCompleted, false);
      assert.ok(res.headers.get("set-cookie")?.includes(SESSION_COOKIE));

      const me = await app.request("/me", { headers: { cookie: cookieHeader(res) } });
      assert.equal(me.status, 200);
      assert.deepEqual(await me.json(), body.user);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("rejects a Google account that is not on the allowlist", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `stranger.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      const sessionsBefore = await db.select().from(sessions);
      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email, displayName: "Stranger" }),
      });

      const res = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake-id-token" }),
      });
      assert.equal(res.status, 403);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, "NOT_ALLOWED");

      const [user] = await db.select().from(users).where(eq(users.email, email));
      assert.equal(user, undefined);
      const sessionsAfter = await db.select().from(sessions);
      assert.equal(sessionsAfter.length, sessionsBefore.length);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("marks the profile complete after PATCH /me", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `riya.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values({ email });
      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email, displayName: "Riya" }),
      });

      const login = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake-id-token" }),
      });
      const cookie = cookieHeader(login);

      const patched = await app.request("/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ displayName: "Riya S" }),
      });
      assert.equal(patched.status, 200);
      const afterPatch = (await patched.json()) as { displayName: string; profileCompleted: boolean };
      assert.equal(afterPatch.displayName, "Riya S");
      assert.equal(afterPatch.profileCompleted, true);

      const me = await app.request("/me", { headers: { cookie } });
      assert.deepEqual(await me.json(), afterPatch);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("requires a session for GET /me and clears it on DELETE", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `sam.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values({ email });
      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email, displayName: "Sam" }),
      });

      const anonymous = await app.request("/me");
      assert.equal(anonymous.status, 401);

      const login = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake-id-token" }),
      });
      const cookie = cookieHeader(login);

      const ended = await app.request("/auth/session", { method: "DELETE", headers: { cookie } });
      assert.equal(ended.status, 204);

      const me = await app.request("/me", { headers: { cookie } });
      assert.equal(me.status, 401);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("redirects GET /auth/google to Supabase with PKCE", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    try {
      await migrateJournal();
      const app = createApp(db, {
        cookieSecure: false,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon",
        publicApiUrl: "http://localhost:3000",
        exchangeGoogle: async () => ({ email: "unused@gmail.com", displayName: "Unused" }),
      });
      const res = await app.request("/auth/google");
      assert.equal(res.status, 302);
      const location = res.headers.get("location") ?? "";
      assert.match(location, /^https:\/\/example\.supabase\.co\/auth\/v1\/authorize/);
      assert.match(location, /provider=google/);
      assert.match(location, /code_challenge=/);
      assert.match(location, /redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback/);
      assert.ok(res.headers.get("set-cookie")?.includes(PKCE_COOKIE));
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("redirects an allowlisted callback to the profile screen", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `callback.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values({ email });
      const app = createApp(db, {
        cookieSecure: false,
        appOrigin: "http://localhost:8081",
        exchangeGoogle: async (input) => {
          assert.equal(input.code, "google-code");
          assert.equal(input.verifier, "pkce-verifier");
          return { email, displayName: "Callback User" };
        },
      });
      const res = await app.request("/auth/callback?code=google-code", {
        headers: { cookie: `${PKCE_COOKIE}=pkce-verifier` },
      });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get("location"), "http://localhost:8081/profile");
      assert.ok(res.headers.get("set-cookie")?.includes(SESSION_COOKIE));
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("does not create a session when GET /auth/callback has no code", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    try {
      await migrateJournal();
      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: "unused@gmail.com", displayName: "Unused" }),
      });
      const res = await app.request("/auth/callback");
      assert.equal(res.status, 400);
      assert.equal(((await res.json()) as { error: { code: string } }).error.code, "AUTH_FAILED");
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("signs in through GET /auth/dev-login only when the bypass flag is on", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `dev.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values({ email });

      const off = createApp(db, { cookieSecure: false, devAuthBypass: false });
      const blocked = await off.request(`/auth/dev-login?email=${encodeURIComponent(email)}`);
      assert.equal(blocked.status, 404);

      const on = createApp(db, {
        cookieSecure: false,
        appOrigin: "http://localhost:8081",
        devAuthBypass: true,
      });
      const res = await on.request(`/auth/dev-login?email=${encodeURIComponent(email)}`);
      assert.equal(res.status, 302);
      assert.ok(res.headers.get("location")?.startsWith("http://localhost:8081/"));
      const me = await on.request("/me", { headers: { cookie: cookieHeader(res) } });
      assert.equal(me.status, 200);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
