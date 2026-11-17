import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { SEED_CATEGORY_NAMES } from "./groups/constants.ts";
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

describe("group categories", { skip: !hasPostgres }, () => {
  it("lists seed categories, creates and renames custom categories", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const emailA = `a.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: emailA }]);

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
        body: JSON.stringify({ name: "Trip" }),
      });
      assert.equal(created.status, 201);
      const group = (await created.json()) as { id: string };

      const list = await app.request(`/groups/${group.id}/categories`, {
        headers: { cookie },
      });
      assert.equal(list.status, 200);
      const body = (await list.json()) as { categories: { id: string; name: string }[] };
      assert.equal(body.categories.length, SEED_CATEGORY_NAMES.length);
      const names = new Set(body.categories.map((row) => row.name));
      for (const seed of SEED_CATEGORY_NAMES) {
        assert.ok(names.has(seed));
      }

      const food = body.categories.find((row) => row.name === "Food");
      assert.ok(food);

      const posted = await app.request(`/groups/${group.id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Fuel" }),
      });
      assert.equal(posted.status, 201);
      const fuel = (await posted.json()) as { id: string; name: string };
      assert.equal(fuel.name, "Fuel");

      const duplicate = await app.request(`/groups/${group.id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Fuel" }),
      });
      assert.equal(duplicate.status, 422);

      const renamed = await app.request(`/groups/${group.id}/categories/${food!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Food and drink" }),
      });
      assert.equal(renamed.status, 200);
      const foodNew = (await renamed.json()) as { name: string };
      assert.equal(foodNew.name, "Food and drink");

      const [row] = await db.select().from(categories).where(eq(categories.id, food!.id));
      assert.equal(row?.name, "Food and drink");
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("returns 404 for categories when the caller is not a member", async () => {
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

      const res = await strangerApp.request(`/groups/${group.id}/categories`, {
        headers: { cookie: strangerCookie },
      });
      assert.equal(res.status, 404);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});

describe("group summary", { skip: !hasPostgres }, () => {
  it("rolls up totals by member and category, excluding voided expenses", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const emailA = `a.${randomUUID()}@gmail.com`;
    const emailB = `b.${randomUUID()}@gmail.com`;
    const idB = `u_${randomUUID()}`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: emailA }, { email: emailB }]);
      await db.insert(users).values([
        { id: idB, email: emailB, displayName: "B", profileCompletedAt: new Date() },
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
        body: JSON.stringify({ name: "Trip", memberEmails: [emailB] }),
      });
      assert.equal(created.status, 201);
      const group = (await created.json()) as { id: string; members: { id: string }[] };
      const [me] = await db.select().from(users).where(eq(users.email, emailA));
      assert.ok(me);

      const cats = await db.select().from(categories).where(eq(categories.groupId, group.id));
      const food = cats.find((row) => row.name === "Food");
      const transport = cats.find((row) => row.name === "Transport");
      assert.ok(food && transport);

      const memberIds = group.members.map((m) => m.id);
      const split80k = memberIds.map((id) => ({ memberId: id, amount: 40000 }));

      const dinner = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          note: "Dinner",
          occurredOn: "2026-11-07",
          categoryId: food.id,
          amount: 80000,
          splitMode: "equal",
          split: split80k,
          fundingLines: [{ memberId: me.id, amount: 80000 }],
        }),
      });
      assert.equal(dinner.status, 201);

      const cab = await app.request(`/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          note: "Cab",
          occurredOn: "2026-11-08",
          categoryId: transport.id,
          amount: 40000,
          splitMode: "equal",
          split: split80k.map((line) => ({ ...line, amount: 20000 })),
          fundingLines: [{ memberId: me.id, amount: 40000 }],
        }),
      });
      assert.equal(cab.status, 201);
      const cabExpense = (await cab.json()) as { id: string };

      await app.request(`/groups/${group.id}/expenses/${cabExpense.id}/void`, {
        method: "POST",
        headers: { cookie },
      });

      const summary = await app.request(`/groups/${group.id}/summary`, {
        headers: { cookie },
      });
      assert.equal(summary.status, 200);
      const trip = (await summary.json()) as {
        currency: string;
        total: number;
        members: { id: string; share: number }[];
        categories: { id: string; name: string; amount: number }[];
      };

      assert.equal(trip.currency, "INR");
      assert.equal(trip.total, 80000);
      const aShare = trip.members.find((row) => row.id === me.id);
      const bShare = trip.members.find((row) => row.id === idB);
      assert.equal(aShare?.share, 40000);
      assert.equal(bShare?.share, 40000);
      assert.equal(trip.categories.length, 1);
      assert.equal(trip.categories[0]?.id, food.id);
      assert.equal(trip.categories[0]?.amount, 80000);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});