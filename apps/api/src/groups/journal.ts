import { computeBalances } from "@spendwise/domain";
import type { ExpenseInput, SettlementInput } from "@spendwise/domain";
import { eq, inArray } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import {
  expenseAllocationLines,
  expenseFundingLines,
  expenses,
  memberships,
  settlements,
} from "../db/schema.ts";

export async function loadGroupBalances(db: Database, groupId: string, memberIds: string[]) {
  if (memberIds.length === 0) {
    return new Map<string, number>();
  }

  const expenseRows = await db.select().from(expenses).where(eq(expenses.groupId, groupId));
  const expenseIds = expenseRows.map((row) => row.id);

  const fundingRows =
    expenseIds.length === 0
      ? []
      : await db
          .select()
          .from(expenseFundingLines)
          .where(inArray(expenseFundingLines.expenseId, expenseIds));
  const allocationRows =
    expenseIds.length === 0
      ? []
      : await db
          .select()
          .from(expenseAllocationLines)
          .where(inArray(expenseAllocationLines.expenseId, expenseIds));

  const settlementRows = await db.select().from(settlements).where(eq(settlements.groupId, groupId));

  const fundingByExpense = new Map<string, typeof fundingRows>();
  for (const line of fundingRows) {
    const list = fundingByExpense.get(line.expenseId) ?? [];
    list.push(line);
    fundingByExpense.set(line.expenseId, list);
  }
  const allocationByExpense = new Map<string, typeof allocationRows>();
  for (const line of allocationRows) {
    const list = allocationByExpense.get(line.expenseId) ?? [];
    list.push(line);
    allocationByExpense.set(line.expenseId, list);
  }

  const expenseInputs: ExpenseInput[] = expenseRows.map((row) => ({
    voided: row.voidedAt !== null,
    fundingLines: (fundingByExpense.get(row.id) ?? []).map((line) => ({
      memberId: line.memberId,
      amount: line.amountPaise,
    })),
    allocationLines: (allocationByExpense.get(row.id) ?? []).map((line) => ({
      memberId: line.memberId,
      amount: line.amountPaise,
    })),
  }));

  const settlementInputs: SettlementInput[] = settlementRows.map((row) => ({
    voided: row.voidedAt !== null,
    fromMemberId: row.fromMemberId,
    toMemberId: row.toMemberId,
    amount: row.amountPaise,
  }));

  const balances = computeBalances(memberIds, expenseInputs, settlementInputs);
  return new Map(balances.map((row) => [row.memberId, row.balance]));
}

export async function memberIdsForGroup(db: Database, groupId: string) {
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.groupId, groupId));
  return rows.map((row) => row.userId);
}

export function balanceForCaller(balanceMap: Map<string, number>, callerId: string) {
  return balanceMap.get(callerId) ?? 0;
}

export function summarizeBalances(balances: number[]) {
  let net = 0;
  let owed = 0;
  let owe = 0;
  for (const balance of balances) {
    net += balance;
    if (balance > 0) owed += balance;
    if (balance < 0) owe += Math.abs(balance);
  }
  return { net, owed, owe };
}
