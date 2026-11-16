import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import { allowedEmails, categories, users } from "./db/schema.ts";

const hasPostgres = await postgresAvailable();

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session, "expected session cookie");
  return session.split(";", 1)[0];
}

describe("group balances", { skip: !hasPostgres }, () => {
  it("returns member balances and a settle-up suggestion after expenses", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const emailA = `a.${randomUUID()}@gmail.com`;
    const emailB = `b.${randomUUID()}@gmail.com`;
    const emailC = `c.${randomUUID()}@gmail.com`;
    const idB = `u_${randomUUID()}`;
    const idC = `u_${randomUUID()}`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: emailA }, { email: emailB }, { email: emailC }]);
      await db.insert(users).values([
        { id: idB, email: emailB, displayName: "B", profileCompletedAt: new Date() },
        { id: idC, email: emailC, displayName: "C", profileCompletedAt: new Date() },
      ]);

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: emailA, displayName: "A" }),
      });

      const login = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake" }),
      });
      const cookie = cookieHeader(login);

      const created = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Trip", memberEmails: [emailB, emailC] }),
      });
      assert.equal(created.status, 201);
      const group = (await created.json()) as { id: string; members: { id: string }[] };
      const [me] = await db.select().from(users).where(eq(users.email, emailA));
      assert.ok(me);
      const memberIds = group.members.map((m) => m.id);
      const [foodCat] = await db
        .select()
        .from(categories)
        .where(eq(categories.groupId, group.id));
      assert.ok(foodCat);

      const perPerson = Math.floor(120000 / memberIds.length);
      const remainder = 120000 - perPerson * memberIds.length;
      const split = memberIds.map((id, index) => ({
        memberId: id,
        amount: perPerson + (index < remainder ? 1 : 0),
      }));

      const post = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          note: "Dinner",
          occurredOn: "2026-11-07",
          categoryId: foodCat.id,
          amount: 120000,
          splitMode: "equal",
          split,
          fundingLines: [{ memberId: me.id, amount: 120000 }],
        }),
      });
      assert.equal(post.status, 201);

      const balancesRes = await app.request(`/groups/${group.id}/balances`, { headers: { cookie } });
      assert.equal(balancesRes.status, 200);
      const balances = (await balancesRes.json()) as {
        members: { id: string; displayName: string; balance: number }[];
        suggestion: { fromMemberId: string; toMemberId: string; amount: number }[];
      };
      assert.equal(balances.members.length, 3);
      const byId = new Map(balances.members.map((row) => [row.id, row.balance]));
      assert.equal(byId.get(me.id), 80000);
      const sum = balances.members.reduce((total, row) => total + row.balance, 0);
      assert.equal(sum, 0);
      assert.ok(balances.suggestion.length >= 1);
      const first = balances.suggestion[0];
      assert.ok(first);
      assert.equal(first.toMemberId, me.id);
      assert.equal(first.amount, 40000);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("returns 404 for a non-member", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const emailA = `owner.${randomUUID()}@gmail.com`;
    const emailB = `outsider.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: emailA }, { email: emailB }]);

      const ownerApp = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: emailA, displayName: "Owner" }),
      });
      const login = await ownerApp.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "x" }),
      });
      const ownerCookie = cookieHeader(login);
      const created = await ownerApp.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: ownerCookie },
        body: JSON.stringify({ name: "Private" }),
      });
      const group = (await created.json()) as { id: string };

      const strangerApp = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: emailB, displayName: "B" }),
      });
      const loginB = await strangerApp.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "y" }),
      });
      const strangerCookie = cookieHeader(loginB);

      const res = await strangerApp.request(`/groups/${group.id}/balances`, {
        headers: { cookie: strangerCookie },
      });
      assert.equal(res.status, 404);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});