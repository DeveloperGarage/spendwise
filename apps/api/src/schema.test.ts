import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

type Snapshot = {
  tables: Record<string, { name: string; columns: Record<string, { name: string; type: string }> }>;
};

const snapshot = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../drizzle/meta/0000_snapshot.json"), "utf8"),
) as Snapshot;

const tables = Object.fromEntries(
  Object.values(snapshot.tables).map((table) => [table.name, table]),
);

describe("journal migration", () => {
  it("has the architecture tables, integer paise, no category on settlements, and no stored balance", () => {
    assert.deepEqual(
      Object.keys(tables).sort(),
      [
        "activity",
        "categories",
        "expense_allocation_lines",
        "expense_funding_lines",
        "expenses",
        "group_invites",
        "groups",
        "memberships",
        "sessions",
        "settlements",
        "users",
      ],
    );

    assert.equal(tables.expenses.columns.gross_paise.type, "integer");
    assert.equal(tables.expense_funding_lines.columns.amount_paise.type, "integer");
    assert.equal(tables.expense_allocation_lines.columns.amount_paise.type, "integer");
    assert.equal(tables.settlements.columns.amount_paise.type, "integer");
    assert.ok(tables.expense_funding_lines.columns.account_id);
    assert.ok(tables.settlements.columns.account_id);
    assert.equal(tables.settlements.columns.category_id, undefined);
    assert.equal(tables.settlements.columns.category, undefined);
    assert.equal(tables.balances, undefined);
  });
});
