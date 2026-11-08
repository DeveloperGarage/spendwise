import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertZeroSum, computeBalances, spendingForMember } from "./balances.ts";
import { describeExpenseForMember } from "./describe.ts";
import { split } from "./split.ts";
import { suggestTransfers } from "./suggest.ts";
import type { ExpenseInput, SettlementInput } from "./types.ts";

const members = ["A", "B", "C", "D", "E"];

function dinner(): ExpenseInput {
  const lines = split(200000, { mode: "equal", memberIds: members });
  assert.equal(lines.ok, true);
  if (!lines.ok) throw new Error("dinner split refused");
  return {
    fundingLines: [{ memberId: "A", amount: 200000 }],
    allocationLines: lines.lines,
  };
}

describe("the worked dinner", () => {
  it("gives A +1600 and the others -400, summing to zero", () => {
    const balances = computeBalances(members, [dinner()], []);
    assert.deepEqual(
      Object.fromEntries(balances.map((row) => [row.memberId, row.balance])),
      { A: 160000, B: -40000, C: -40000, D: -40000, E: -40000 },
    );
    assert.equal(assertZeroSum(balances), true);
  });

  it("moves to +1200 for A after B pays 400, and Food spending stays 400", () => {
    const settlement: SettlementInput = {
      fromMemberId: "B",
      toMemberId: "A",
      amount: 40000,
    };
    const balances = computeBalances(members, [dinner()], [settlement]);
    assert.deepEqual(
      Object.fromEntries(balances.map((row) => [row.memberId, row.balance])),
      { A: 120000, B: 0, C: -40000, D: -40000, E: -40000 },
    );
    assert.equal(assertZeroSum(balances), true);
    assert.equal(spendingForMember("A", [dinner()]), 40000);
    assert.equal(spendingForMember("B", [dinner()]), 40000);
  });

  it("describes the payer as lent 1600 and a guest as owe 400", () => {
    const expense = dinner();
    assert.deepEqual(describeExpenseForMember(expense, "A"), {
      paid: 200000,
      share: 40000,
      effect: "lent",
      effectAmount: 160000,
    });
    assert.deepEqual(describeExpenseForMember(expense, "B"), {
      paid: 0,
      share: 40000,
      effect: "owe",
      effectAmount: 40000,
    });
  });
});

describe("voids and random journals", () => {
  it("ignores a voided expense and a voided settlement", () => {
    const live = dinner();
    const voidedExpense: ExpenseInput = { ...live, voided: true };
    const voidedSettlement: SettlementInput = {
      fromMemberId: "B",
      toMemberId: "A",
      amount: 40000,
      voided: true,
    };
    const balances = computeBalances(members, [voidedExpense], [voidedSettlement]);
    assert.ok(balances.every((row) => row.balance === 0));
    assert.equal(assertZeroSum(balances), true);
  });

  it("keeps a zero-sum across random expenses, settlements, and voids", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      let n = seed;
      const next = () => {
        n = (n * 1103515245 + 12345) >>> 0;
        return n;
      };
      const expenses: ExpenseInput[] = [];
      const settlements: SettlementInput[] = [];
      for (let i = 0; i < 8; i += 1) {
        const gross = ((next() % 50) + 1) * 100;
        const count = (next() % 5) + 1;
        const ids = members.slice(0, count);
        const lines = split(gross, { mode: "equal", memberIds: ids });
        if (!lines.ok) continue;
        const payer = ids[next() % ids.length];
        expenses.push({
          voided: next() % 7 === 0,
          fundingLines: [{ memberId: payer, amount: gross }],
          allocationLines: lines.lines,
        });
        if (ids.length >= 2 && next() % 3 === 0) {
          settlements.push({
            voided: next() % 5 === 0,
            fromMemberId: ids[0],
            toMemberId: ids[1],
            amount: ((next() % 20) + 1) * 100,
          });
        }
      }
      const balances = computeBalances(members, expenses, settlements);
      assert.equal(assertZeroSum(balances), true, `seed ${seed}`);
    }
  });
});

describe("suggestTransfers", () => {
  it("is stable and the transfers sum to the debt", () => {
    const balances = [
      { memberId: "A", balance: 120000 },
      { memberId: "B", balance: 0 },
      { memberId: "C", balance: -40000 },
      { memberId: "D", balance: -40000 },
      { memberId: "E", balance: -40000 },
    ];
    const first = suggestTransfers(balances);
    const second = suggestTransfers(balances);
    assert.deepEqual(first, second);
    assert.deepEqual(first, [
      { fromMemberId: "C", toMemberId: "A", amount: 40000 },
      { fromMemberId: "D", toMemberId: "A", amount: 40000 },
      { fromMemberId: "E", toMemberId: "A", amount: 40000 },
    ]);
    assert.equal(
      first.reduce((sum, row) => sum + row.amount, 0),
      120000,
    );
  });
});
