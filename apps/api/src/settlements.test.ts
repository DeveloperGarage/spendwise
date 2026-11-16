import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import { allowedEmails, categories, settlements, users } from "./db/schema.ts";

const hasPostgres = await postgresAvailable();

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session, "expected session cookie");
  return session.split(";", 1)[0];
}

describe("settlements", { skip: !hasPostgres }, () => {
  it("creates a settlement, updates balances, lists, edits, and voids", async () => {
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
      const group = (await created.json()) as { id: string; members: { id: string }[] };
      const [me] = await db.select().from(users).where(eq(users.email, emailA));
      assert.ok(me);
      const debtor = group.members.find((m) => m.id !== me.id);
      assert.ok(debtor);
      const [foodCat] = await db
        .select()
        .from(categories)
        .where(eq(categories.groupId, group.id));
      assert.ok(foodCat);

      const memberIds = group.members.map((m) => m.id);
      const perPerson = Math.floor(120000 / memberIds.length);
      const remainder = 120000 - perPerson * memberIds.length;
      const split = memberIds.map((id, index) => ({
        memberId: id,
        amount: perPerson + (index < remainder ? 1 : 0),
      }));

      const expensePost = await app.request(`/groups/${group.id}/expenses`, {
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
      assert.equal(expensePost.status, 201);

      const beforeBalances = await app.request(`/groups/${group.id}/balances`, { headers: { cookie } });
      const before = (await beforeBalances.json()) as {
        members: { id: string; balance: number }[];
      };
      const debtorBefore = before.members.find((m) => m.id === debtor.id)?.balance;
      assert.ok(debtorBefore !== undefined && debtorBefore < 0);

      const settleBody = {
        fromMemberId: debtor.id,
        toMemberId: me.id,
        amount: 40000,
        occurredOn: "2026-11-08",
        note: "UPI",
      };
      const post = await app.request(`/groups/${group.id}/settlements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(settleBody),
      });
      assert.equal(post.status, 201);
      const settlement = (await post.json()) as { id: string; version: number; amount: number };
      assert.equal(settlement.amount, 40000);
      assert.equal(settlement.version, 1);

      const afterBalances = await app.request(`/groups/${group.id}/balances`, { headers: { cookie } });
      const after = (await afterBalances.json()) as {
        members: { id: string; balance: number }[];
      };
      const debtorAfter = after.members.find((m) => m.id === debtor.id)?.balance;
      assert.equal(debtorAfter, (debtorBefore ?? 0) + 40000);

      const list = await app.request(`/groups/${group.id}/settlements`, { headers: { cookie } });
      assert.equal(list.status, 200);
      const listed = (await list.json()) as { settlements: { id: string }[] };
      assert.equal(listed.settlements.length, 1);

      const get = await app.request(`/groups/${group.id}/settlements/${settlement.id}`, {
        headers: { cookie },
      });
      assert.equal(get.status, 200);

      const put = await app.request(`/groups/${group.id}/settlements/${settlement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ ...settleBody, note: "Updated", version: 1 }),
      });
      assert.equal(put.status, 200);
      const updated = (await put.json()) as { version: number; note: string };
      assert.equal(updated.version, 2);
      assert.equal(updated.note, "Updated");

      const voided = await app.request(
        `/groups/${group.id}/settlements/${settlement.id}/void`,
        { method: "POST", headers: { cookie } },
      );
      assert.equal(voided.status, 200);
      const voidBody = (await voided.json()) as { voided: boolean };
      assert.equal(voidBody.voided, true);

      const restored = await app.request(`/groups/${group.id}/balances`, { headers: { cookie } });
      const restoredBody = (await restored.json()) as {
        members: { id: string; balance: number }[];
      };
      const debtorRestored = restoredBody.members.find((m) => m.id === debtor.id)?.balance;
      assert.equal(debtorRestored, debtorBefore);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("rejects category on create and returns 404 for non-member", async () => {
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
      const cookie = cookieHeader(login);
      const created = await ownerApp.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Private" }),
      });
      const group = (await created.json()) as { id: string };
      const [me] = await db.select().from(users).where(eq(users.email, emailA));

      const bad = await ownerApp.request(`/groups/${group.id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          fromMemberId: me!.id,
          toMemberId: me!.id,
          amount: 100,
          occurredOn: "2026-11-07",
          categoryId: "c_food",
        }),
      });
      assert.equal(bad.status, 422);

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

      const list = await strangerApp.request(`/groups/${group.id}/settlements`, {
        headers: { cookie: strangerCookie },
      });
      assert.equal(list.status, 404);

      const count = await db.select().from(settlements).where(eq(settlements.groupId, group.id));
      assert.equal(count.length, 0);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});