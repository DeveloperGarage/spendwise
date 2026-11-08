import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { eq } from "drizzle-orm";

import { DATABASE_URL, postgresAvailable } from "./db/available.ts";
import { createDb } from "./db/client.ts";
import { migrateJournal } from "./db/migrate.ts";
import {
  categories,
  expenseAllocationLines,
  expenseFundingLines,
  expenses,
  groups,
  memberships,
  users,
} from "./db/schema.ts";
import { amountToJson } from "./money.ts";

const hasPostgres = await postgresAvailable();

describe("journal paise round-trip", { skip: !hasPostgres }, () => {
  it("stores ₹1,200.00 as integer 120000 and JSON-encodes it as a number", async () => {
    const { db, sql } = createDb(DATABASE_URL);
    try {
      await migrateJournal(db);
      const userId = `u_${randomUUID()}`;
      const groupId = `g_${randomUUID()}`;
      const categoryId = `c_${randomUUID()}`;
      const expenseId = `e_${randomUUID()}`;

      await db.insert(users).values({
        id: userId,
        email: `${userId}@spendwise.test`,
        displayName: "Aman",
      });
      await db.insert(groups).values({ id: groupId, name: "Goa Trip" });
      await db.insert(memberships).values({ groupId, userId });
      await db.insert(categories).values({ id: categoryId, groupId, name: "Food" });
      await db.insert(expenses).values({
        id: expenseId,
        groupId,
        note: "Dinner at Britto's",
        occurredOn: "2026-11-07",
        categoryId,
        grossPaise: 120000,
        splitMode: "equal",
        createdBy: userId,
      });
      await db.insert(expenseFundingLines).values({
        id: `f_${randomUUID()}`,
        expenseId,
        memberId: userId,
        amountPaise: 120000,
      });
      await db.insert(expenseAllocationLines).values({
        id: `a_${randomUUID()}`,
        expenseId,
        memberId: userId,
        amountPaise: 120000,
        categoryId,
      });

      const [row] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      assert.equal(typeof row.grossPaise, "number");
      assert.equal(row.grossPaise, 120000);
      assert.equal(JSON.stringify({ amount: amountToJson(row.grossPaise) }), '{"amount":120000}');
      assert.equal(JSON.parse('{"amount":120000}').amount, 120000);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
