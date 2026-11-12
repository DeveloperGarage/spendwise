import { randomBytes } from "node:crypto";

import {
  assertZeroSum,
  computeBalances,
  describeExpenseForMember,
  split,
  type SplitInput,
} from "@spendwise/domain";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import {
  activity,
  categories,
  expenseAllocationLines,
  expenseFundingLines,
  expenseIdempotency,
  expenses,
  groups,
  settlements,
  users,
} from "../db/schema.ts";
import { amountToJson } from "../money.ts";
import { isGroupMember } from "../groups/service.ts";
import { memberIdsForGroup } from "../groups/journal.ts";
import type { ParsedCreateExpense } from "./parse-body.ts";

export type ExpenseListItemJson = {
  id: string;
  version: number;
  note: string;
  occurredOn: string;
  category: { id: string; name: string };
  amount: number;
  payer: { id: string; displayName: string };
  caller: { paid: number; share: number; effect: string; effectAmount: number };
  voided: boolean;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function memberIdsFromSplit(input: SplitInput): string[] {
  switch (input.mode) {
    case "equal":
      return input.memberIds;
    case "exact":
      return input.amounts.map((row) => row.memberId);
    case "percentage":
      return input.percentages.map((row) => row.memberId);
    case "shares":
      return input.shares.map((row) => row.memberId);
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}\t${id}`;
}

function decodeCursor(cursor: string): { at: Date; id: string } | null {
  const tab = cursor.indexOf("\t");
  if (tab < 0) return null;
  const at = new Date(cursor.slice(0, tab));
  const id = cursor.slice(tab + 1);
  if (Number.isNaN(at.getTime()) || !id) return null;
  return { at, id };
}

async function loadExpenseJson(
  db: Database,
  expenseId: string,
  callerId: string,
): Promise<ExpenseListItemJson | null> {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
  if (!row) return null;

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.id, row.categoryId));

  const fundingRows = await db
    .select()
    .from(expenseFundingLines)
    .where(eq(expenseFundingLines.expenseId, expenseId));
  const allocationRows = await db
    .select()
    .from(expenseAllocationLines)
    .where(eq(expenseAllocationLines.expenseId, expenseId));

  if (fundingRows.length === 0) return null;
  const payerId = fundingRows[0].memberId;
  const [payer] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, payerId));

  const expenseInput = {
    voided: row.voidedAt !== null,
    fundingLines: fundingRows.map((line) => ({
      memberId: line.memberId,
      amount: line.amountPaise,
    })),
    allocationLines: allocationRows.map((line) => ({
      memberId: line.memberId,
      amount: line.amountPaise,
    })),
  };
  const caller = describeExpenseForMember(expenseInput, callerId);

  return {
    id: row.id,
    version: row.version,
    note: row.note,
    occurredOn: String(row.occurredOn),
    category: category ?? { id: row.categoryId, name: "" },
    amount: amountToJson(row.grossPaise),
    payer: payer ?? { id: payerId, displayName: "" },
    caller: {
      paid: amountToJson(caller.paid),
      share: amountToJson(caller.share),
      effect: caller.effect,
      effectAmount: amountToJson(caller.effectAmount),
    },
    voided: row.voidedAt !== null,
  };
}

async function findIdempotentExpense(
  db: Database,
  userId: string,
  groupId: string,
  key: string,
) {
  const [row] = await db
    .select({ expenseId: expenseIdempotency.expenseId })
    .from(expenseIdempotency)
    .where(
      and(
        eq(expenseIdempotency.userId, userId),
        eq(expenseIdempotency.groupId, groupId),
        eq(expenseIdempotency.idempotencyKey, key),
      ),
    );
  return row?.expenseId ?? null;
}

export type CreateExpenseResult =
  | { ok: true; expense: ExpenseListItemJson; replay: boolean }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "field"; field: string }
  | { ok: false; kind: "split_refused"; gap: number };

export async function createExpense(
  db: Database,
  groupId: string,
  callerId: string,
  idempotencyKey: string,
  parsed: ParsedCreateExpense,
): Promise<CreateExpenseResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const replayId = await findIdempotentExpense(db, callerId, groupId, idempotencyKey);
  if (replayId) {
    const expense = await loadExpenseJson(db, replayId, callerId);
    if (!expense) throw new Error("idempotent expense row missing");
    return { ok: true, expense, replay: true };
  }

  const memberIds = new Set(await memberIdsForGroup(db, groupId));
  const splitMembers = memberIdsFromSplit(parsed.split);
  const allReferenced = new Set([parsed.fundingMemberId, ...splitMembers]);
  for (const id of allReferenced) {
    if (!memberIds.has(id)) {
      return { ok: false, kind: "field", field: "split" };
    }
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, parsed.categoryId), eq(categories.groupId, groupId)));
  if (!category) {
    return { ok: false, kind: "field", field: "categoryId" };
  }

  const splitResult = split(parsed.amount, parsed.split);
  if (!splitResult.ok) {
    return { ok: false, kind: "split_refused", gap: splitResult.gap };
  }

  const expenseId = `e_${randomBytes(8).toString("hex")}`;
  const splitMode = parsed.split.mode;
  const memberIdList = [...memberIds];
  let racedToExisting = false;

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ expenseId: expenseIdempotency.expenseId })
      .from(expenseIdempotency)
      .where(
        and(
          eq(expenseIdempotency.userId, callerId),
          eq(expenseIdempotency.groupId, groupId),
          eq(expenseIdempotency.idempotencyKey, idempotencyKey),
        ),
      );
    if (existing.length > 0) {
      racedToExisting = true;
      return;
    }

    await tx.insert(expenses).values({
      id: expenseId,
      groupId,
      note: parsed.note,
      occurredOn: parsed.occurredOn,
      categoryId: parsed.categoryId,
      grossPaise: parsed.amount,
      currency: group.currency,
      splitMode,
      version: 1,
      createdBy: callerId,
    });

    await tx.insert(expenseFundingLines).values({
      id: `f_${randomBytes(8).toString("hex")}`,
      expenseId,
      memberId: parsed.fundingMemberId,
      amountPaise: parsed.amount,
    });

    for (const line of splitResult.lines) {
      await tx.insert(expenseAllocationLines).values({
        id: `a_${randomBytes(8).toString("hex")}`,
        expenseId,
        memberId: line.memberId,
        amountPaise: line.amount,
        categoryId: parsed.categoryId,
      });
    }

    const journalBalances = computeBalances(
      memberIdList,
      await loadExpenseInputsForGroup(tx as unknown as Database, groupId),
      await loadSettlementInputsForGroup(tx as unknown as Database, groupId),
    );
    if (!assertZeroSum(journalBalances)) {
      throw new Error("group balances do not sum to zero after expense create");
    }

    await tx.insert(activity).values({
      id: `act_${randomBytes(8).toString("hex")}`,
      groupId,
      actorId: callerId,
      kind: "expense",
      action: "created",
      subjectId: expenseId,
      snapshot: {
        note: parsed.note,
        occurredOn: parsed.occurredOn,
        categoryId: parsed.categoryId,
        amount: parsed.amount,
        splitMode,
        fundingMemberId: parsed.fundingMemberId,
      },
    });

    await tx.insert(expenseIdempotency).values({
      userId: callerId,
      groupId,
      idempotencyKey,
      expenseId,
    });
  });

  const finalId =
    (await findIdempotentExpense(db, callerId, groupId, idempotencyKey)) ?? expenseId;
  const expense = await loadExpenseJson(db, finalId, callerId);
  if (!expense) throw new Error("expense missing after create");
  const replay = racedToExisting || finalId !== expenseId;
  return { ok: true, expense, replay };
}

async function loadSettlementInputsForGroup(db: Database, groupId: string) {
  const settlementRows = await db.select().from(settlements).where(eq(settlements.groupId, groupId));
  return settlementRows.map((row) => ({
    voided: row.voidedAt !== null,
    fromMemberId: row.fromMemberId,
    toMemberId: row.toMemberId,
    amount: row.amountPaise,
  }));
}

async function loadExpenseInputsForGroup(db: Database, groupId: string) {
  const expenseRows = await db.select().from(expenses).where(eq(expenses.groupId, groupId));
  const expenseIds = expenseRows.map((row) => row.id);
  if (expenseIds.length === 0) return [];

  const fundingRows = await db
    .select()
    .from(expenseFundingLines)
    .where(inArray(expenseFundingLines.expenseId, expenseIds));
  const allocationRows = await db
    .select()
    .from(expenseAllocationLines)
    .where(inArray(expenseAllocationLines.expenseId, expenseIds));

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

  return expenseRows.map((row) => ({
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
}

export type ListExpensesResult =
  | { ok: true; expenses: ExpenseListItemJson[]; nextCursor: string | null }
  | { ok: false; kind: "not_found" };

export async function listExpenses(
  db: Database,
  groupId: string,
  callerId: string,
  options: { limit?: number; cursor?: string },
): Promise<ListExpensesResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  let limit = options.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const decoded = options.cursor ? decodeCursor(options.cursor) : null;
  if (options.cursor && !decoded) {
    return { ok: true, expenses: [], nextCursor: null };
  }

  const conditions = [eq(expenses.groupId, groupId)];
  if (decoded) {
    conditions.push(
      or(
        lt(expenses.createdAt, decoded.at),
        and(eq(expenses.createdAt, decoded.at), lt(expenses.id, decoded.id)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.createdAt), desc(expenses.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const items: ExpenseListItemJson[] = [];
  for (const row of page) {
    const item = await loadExpenseJson(db, row.id, callerId);
    if (item) items.push(item);
  }

  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;

  return { ok: true, expenses: items, nextCursor };
}
