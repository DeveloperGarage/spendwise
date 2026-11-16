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

describe("group activity", { skip: !hasPostgres }, () => {
  it("lists expense and settlement activity newest first", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const emailA = `a.${randomUUID()}@gmail.com`;
    const emailB = `b.${randomUUID()}@gmail.com`;
    const idB = `u_${randomUUID()}`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: emailA }, { email: emailB }]);
      await db.insert(users).values({
        id: idB,
        email: emailB,
        displayName: "B",
        profileCompletedAt: new Date(),
      });

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: emailA, displayName: "Aman" }),
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
        body: JSON.stringify({ name: "Trip", memberEmails: [emailB] }),
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

      const postExpense = await app.request(`/groups/${group.id}/expenses`, {
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
          amount: 40000,
          splitMode: "equal",
          split: [
            { memberId: me.id, amount: 20000 },
            { memberId: debtor.id, amount: 20000 },
          ],
          fundingLines: [{ memberId: me.id, amount: 40000 }],
        }),
      });
      assert.equal(postExpense.status, 201);
      const expense = (await postExpense.json()) as { id: string; version: number };

      const put = await app.request(`/groups/${group.id}/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          note: "Dinner updated",
          occurredOn: "2026-11-07",
          categoryId: foodCat.id,
          amount: 40000,
          splitMode: "equal",
          split: [
            { memberId: me.id, amount: 20000 },
            { memberId: debtor.id, amount: 20000 },
          ],
          fundingLines: [{ memberId: me.id, amount: 40000 }],
          version: 1,
        }),
      });
      assert.equal(put.status, 200);

      const settle = await app.request(`/groups/${group.id}/settlements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          fromMemberId: debtor.id,
          toMemberId: me.id,
          amount: 20000,
          occurredOn: "2026-11-08",
          note: "",
        }),
      });
      assert.equal(settle.status, 201);

      const list = await app.request(`/groups/${group.id}/activity`, { headers: { cookie } });
      assert.equal(list.status, 200);
      const body = (await list.json()) as {
        activities: {
          kind: string;
          action: string;
          actor: { displayName: string };
          snapshot: { note?: string };
        }[];
        nextCursor: string | null;
      };
      assert.ok(body.activities.length >= 3);
      assert.equal(body.activities[0]?.kind, "settlement");
      assert.equal(body.activities[0]?.action, "created");
      const expenseEdited = body.activities.find(
        (row) => row.kind === "expense" && row.action === "edited",
      );
      assert.ok(expenseEdited);
      assert.equal(expenseEdited.snapshot.note, "Dinner updated");
      assert.equal(expenseEdited.actor.displayName, "Aman");
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
      const cookie = cookieHeader(login);
      const created = await ownerApp.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
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

      const res = await strangerApp.request(`/groups/${group.id}/activity`, {
        headers: { cookie: strangerCookie },
      });
      assert.equal(res.status, 404);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});