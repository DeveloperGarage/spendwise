import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { SESSION_COOKIE } from "./auth.ts";
import { createApp } from "./app.ts";
import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import { SEED_CATEGORY_NAMES } from "./groups/constants.ts";
import { allowedEmails, categories, groups, memberships, users } from "./db/schema.ts";

const hasPostgres = await postgresAvailable();

function cookieHeader(response: Response) {
  const cookies = response.headers.getSetCookie();
  const session = cookies.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  assert.ok(session, "expected session cookie");
  return session.split(";", 1)[0];
}

describe("groups and dashboard", { skip: !hasPostgres }, () => {
  it("creates a group, seeds categories, and returns a zero dashboard", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `creator.${randomUUID()}@gmail.com`;
    const otherEmail = `friend.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email }, { email: otherEmail }]);
      await db.insert(users).values({
        id: `u_${randomUUID()}`,
        email: otherEmail,
        displayName: "Friend",
        profileCompletedAt: new Date(),
      });

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email, displayName: "Creator" }),
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
        body: JSON.stringify({ name: "Goa Trip", memberEmails: [otherEmail] }),
      });
      assert.equal(created.status, 201);
      const group = (await created.json()) as {
        id: string;
        name: string;
        currency: string;
        balance: number;
        members: { email: string }[];
      };
      assert.equal(group.name, "Goa Trip");
      assert.equal(group.currency, "INR");
      assert.equal(group.balance, 0);
      assert.equal(group.members.length, 2);

      const memberList = await app.request(`/groups/${group.id}/members`, { headers: { cookie } });
      assert.equal(memberList.status, 200);
      const listed = (await memberList.json()) as { members: { email: string; displayName: string }[] };
      assert.equal(listed.members.length, 2);
      assert.ok(listed.members.some((member) => member.email === otherEmail));

      const seeded = await db.select().from(categories).where(eq(categories.groupId, group.id));
      assert.equal(seeded.length, SEED_CATEGORY_NAMES.length);

      const dashboard = await app.request("/dashboard", { headers: { cookie } });
      assert.equal(dashboard.status, 200);
      const dash = (await dashboard.json()) as {
        summary: { net: number; owed: number; owe: number; currency: string };
        groups: { id: string; balance: number }[];
      };
      assert.equal(dash.summary.currency, "INR");
      assert.equal(dash.summary.net, 0);
      assert.equal(dash.summary.owed, 0);
      assert.equal(dash.summary.owe, 0);
      assert.equal(dash.groups.length, 1);
      assert.equal(dash.groups[0]?.id, group.id);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("rejects memberEmails when the user has not signed in yet", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const email = `solo.${randomUUID()}@gmail.com`;
    const stranger = `stranger.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email }, { email: stranger }]);

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

      const before = await db.select().from(groups);
      const bad = await app.request("/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ name: "Trip", memberEmails: [stranger] }),
      });
      assert.equal(bad.status, 422);
      const after = await db.select().from(groups);
      assert.equal(after.length, before.length);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("returns 404 for a group the caller is not in", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const aEmail = `a.${randomUUID()}@gmail.com`;
    const bEmail = `b.${randomUUID()}@gmail.com`;
    const groupId = `g_${randomUUID()}`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: aEmail }, { email: bEmail }]);
      const [a] = await db
        .insert(users)
        .values({
          id: `u_${randomUUID()}`,
          email: aEmail,
          displayName: "A",
          profileCompletedAt: new Date(),
        })
        .returning();
      await db.insert(users).values({
        id: `u_${randomUUID()}`,
        email: bEmail,
        displayName: "B",
        profileCompletedAt: new Date(),
      });
      await db.insert(groups).values({ id: groupId, name: "Secret", currency: "INR" });
      await db.insert(memberships).values({ groupId, userId: a.id });

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: bEmail, displayName: "B" }),
      });
      const login = await app.request("/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", idToken: "fake" }),
      });
      const cookie = cookieHeader(login);

      const res = await app.request(`/groups/${groupId}`, { headers: { cookie } });
      assert.equal(res.status, 404);
      const members = await app.request(`/groups/${groupId}/members`, { headers: { cookie } });
      assert.equal(members.status, 404);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it("adds members in batch through POST /groups/:groupId/members", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    const creator = `creator.${randomUUID()}@gmail.com`;
    const m1 = `m1.${randomUUID()}@gmail.com`;
    const m2 = `m2.${randomUUID()}@gmail.com`;
    try {
      await migrateJournal();
      await db.insert(allowedEmails).values([{ email: creator }, { email: m1 }, { email: m2 }]);
      await db.insert(users).values([
        {
          id: `u_${randomUUID()}`,
          email: m1,
          displayName: "M1",
          profileCompletedAt: new Date(),
        },
        {
          id: `u_${randomUUID()}`,
          email: m2,
          displayName: "M2",
          profileCompletedAt: new Date(),
        },
      ]);

      const app = createApp(db, {
        cookieSecure: false,
        exchangeGoogle: async () => ({ email: creator, displayName: "Creator" }),
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
        body: JSON.stringify({ name: "Batch" }),
      });
      const { id: groupId } = (await created.json()) as { id: string };

      const added = await app.request(`/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ memberEmails: [m1, m2] }),
      });
      assert.equal(added.status, 201);
      const body = (await added.json()) as { members: { email: string }[] };
      assert.equal(body.members.length, 3);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
