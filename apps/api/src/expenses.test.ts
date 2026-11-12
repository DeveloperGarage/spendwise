import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import { allowedEmails, categories, expenseIdempotency, expenses, users } from "./db/schema.ts";

const hasPostgres = await postgresAvailable();

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session, "expected session cookie");
  return session.split(";", 1)[0];
}

describe("expenses", { skip: !hasPostgres }, () => {
  it("creates an equal split expense, updates dashboard, and replays idempotency", async () => {
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

      const body = {
        note: "Dinner",
        occurredOn: "2026-11-07",
        categoryId: foodCat.id,
        amount: 120000,
        split: { mode: "equal" as const, memberIds },
        fundingLines: [{ memberId: me.id, amount: 120000 }],
      };

      const post = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": "k1",
        },
        body: JSON.stringify(body),
      });
      assert.equal(post.status, 201);
      const expense = (await post.json()) as {
        id: string;
        amount: number;
        caller: { effect: string; effectAmount: number };
      };
      assert.equal(expense.amount, 120000);
      assert.equal(expense.caller.effect, "lent");
      assert.equal(expense.caller.effectAmount, 80000);

      const replay = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": "k1",
        },
        body: JSON.stringify(body),
      });
      assert.equal(replay.status, 201);
      const again = (await replay.json()) as { id: string };
      assert.equal(again.id, expense.id);
      const idemRows = await db.select().from(expenseIdempotency).where(eq(expenseIdempotency.groupId, group.id));
      assert.equal(idemRows.length, 1);

      const list = await app.request(`/groups/${group.id}/expenses`, { headers: { cookie } });
      assert.equal(list.status, 200);
      const listed = (await list.json()) as { expenses: { id: string }[]; nextCursor: string | null };
      assert.equal(listed.expenses.length, 1);
      assert.equal(listed.expenses[0]?.id, expense.id);
      assert.equal(listed.nextCursor, null);

      const dash = await app.request("/dashboard", { headers: { cookie } });
      const dashboard = (await dash.json()) as { summary: { owed: number }; groups: { balance: number }[] };
      assert.equal(dashboard.summary.owed, 80000);
      assert.equal(dashboard.groups[0]?.balance, 80000);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("refuses exact split that does not add up", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `solo.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email }]);

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email, displayName: "Solo" }),
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
        body: JSON.stringify({ name: "Solo" }),
      });
      const group = (await created.json()) as { id: string };
      const [me] = await db.select().from(users).where(eq(users.email, email));
      const [cat] = await db.select().from(categories).where(eq(categories.groupId, group.id));

      const bad = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": "k2",
        },
        body: JSON.stringify({
          note: "",
          occurredOn: "2026-11-07",
          categoryId: cat.id,
          amount: 10000,
          split: { mode: "exact", amounts: [{ memberId: me.id, amount: 5000 }] },
          fundingLines: [{ memberId: me.id, amount: 10000 }],
        }),
      });
      assert.equal(bad.status, 422);
      const err = (await bad.json()) as { error: { code: string; details: { gap: number } } };
      assert.equal(err.error.code, "SPLIT_REFUSED");
      assert.equal(typeof err.error.details.gap, "number");

      const count = await db.select().from(expenses).where(eq(expenses.groupId, group.id));
      assert.equal(count.length, 0);
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

      const list = await strangerApp.request(`/groups/${group.id}/expenses`, {
        headers: { cookie: strangerCookie },
      });
      assert.equal(list.status, 404);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
