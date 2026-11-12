import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

type Snapshot = {
  tables: Record<string, { name: string; columns: Record<string, { name: string; type: string }> }>;
};

const metaDir = join(dirname(fileURLToPath(import.meta.url)), "../drizzle/meta");
const journal = JSON.parse(readFileSync(join(metaDir, "_journal.json"), "utf8")) as {
  entries: { idx: number }[];
};
const latest = journal.entries.at(-1);
if (!latest) throw new Error("drizzle journal is empty");
const snapshot = JSON.parse(
  readFileSync(join(metaDir, `${String(latest.idx).padStart(4, "0")}_snapshot.json`), "utf8"),
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
        "allowed_emails",
        "categories",
        "expense_allocation_lines",
        "expense_funding_lines",
        "expense_idempotency",
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
    assert.ok(tables.allowed_emails.columns.email);
    assert.ok(tables.users.columns.profile_completed_at);
  });
});
