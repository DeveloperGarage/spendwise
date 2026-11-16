import { randomBytes } from "node:crypto";

import { assertZeroSum, computeBalances } from "@spendwise/domain";
import { and, desc, eq, inArray, lt, or } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import {
  activity,
  expenseAllocationLines,
  expenseFundingLines,
  expenses,
  groups,
  settlements,
} from "../db/schema.ts";
import { amountToJson } from "../money.ts";
import { memberIdsForGroup } from "../groups/journal.ts";
import { isGroupMember } from "../groups/service.ts";
import type { ParsedCreateSettlement, ParsedReplaceSettlement } from "./parse-body.ts";

export type SettlementJson = {
  id: string;
  version: number;
  voided: boolean;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  occurredOn: string;
  note: string;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

class ReplaceBlockedError extends Error {
  constructor(readonly reason: "voided" | "version_conflict") {
    super(reason);
  }
}

function settlementJsonFromRow(row: typeof settlements.$inferSelect): SettlementJson {
  return {
    id: row.id,
    version: row.version,
    voided: row.voidedAt !== null,
    fromMemberId: row.fromMemberId,
    toMemberId: row.toMemberId,
    amount: amountToJson(row.amountPaise),
    occurredOn: String(row.occurredOn),
    note: row.note,
  };
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

async function assertGroupBalancesZero(db: Database, groupId: string, memberIdList: string[]) {
  const journalBalances = computeBalances(
    memberIdList,
    await loadExpenseInputsForGroup(db, groupId),
    await loadSettlementInputsForGroup(db, groupId),
  );
  if (!assertZeroSum(journalBalances)) {
    throw new Error("group balances do not sum to zero");
  }
}

async function validateMemberIds(
  db: Database,
  groupId: string,
  parsed: ParsedCreateSettlement,
): Promise<{ ok: true } | { ok: false; field: string }> {
  const memberIds = new Set(await memberIdsForGroup(db, groupId));
  if (!memberIds.has(parsed.fromMemberId) || !memberIds.has(parsed.toMemberId)) {
    return { ok: false, field: "fromMemberId" };
  }
  return { ok: true };
}

export type CreateSettlementResult =
  | { ok: true; settlement: SettlementJson }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "field"; field: string };

export async function createSettlement(
  db: Database,
  groupId: string,
  callerId: string,
  parsed: ParsedCreateSettlement,
): Promise<CreateSettlementResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const members = await validateMemberIds(db, groupId, parsed);
  if (!members.ok) {
    return { ok: false, kind: "field", field: members.field };
  }

  const settlementId = `s_${randomBytes(8).toString("hex")}`;
  const memberIdList = await memberIdsForGroup(db, groupId);

  await db.transaction(async (tx) => {
    await tx.insert(settlements).values({
      id: settlementId,
      groupId,
      fromMemberId: parsed.fromMemberId,
      toMemberId: parsed.toMemberId,
      amountPaise: parsed.amount,
      occurredOn: parsed.occurredOn,
      note: parsed.note,
      version: 1,
      createdBy: callerId,
    });

    await assertGroupBalancesZero(tx as unknown as Database, groupId, memberIdList);

    await tx.insert(activity).values({
      id: `act_${randomBytes(8).toString("hex")}`,
      groupId,
      actorId: callerId,
      kind: "settlement",
      action: "created",
      subjectId: settlementId,
      snapshot: {
        fromMemberId: parsed.fromMemberId,
        toMemberId: parsed.toMemberId,
        amount: parsed.amount,
        occurredOn: parsed.occurredOn,
        note: parsed.note,
      },
    });
  });

  const [row] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
  if (!row) throw new Error("settlement missing after create");
  return { ok: true, settlement: settlementJsonFromRow(row) };
}

export type ListSettlementsResult =
  | { ok: true; settlements: SettlementJson[]; nextCursor: string | null }
  | { ok: false; kind: "not_found" };

export async function listSettlements(
  db: Database,
  groupId: string,
  callerId: string,
  options: { limit?: number; cursor?: string },
): Promise<ListSettlementsResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  let limit = options.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const decoded = options.cursor ? decodeCursor(options.cursor) : null;
  if (options.cursor && !decoded) {
    return { ok: true, settlements: [], nextCursor: null };
  }

  const conditions = [eq(settlements.groupId, groupId)];
  if (decoded) {
    conditions.push(
      or(
        lt(settlements.createdAt, decoded.at),
        and(eq(settlements.createdAt, decoded.at), lt(settlements.id, decoded.id)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(settlements)
    .where(and(...conditions))
    .orderBy(desc(settlements.createdAt), desc(settlements.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const items = page.map(settlementJsonFromRow);
  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;

  return { ok: true, settlements: items, nextCursor };
}

export type GetSettlementResult =
  | { ok: true; settlement: SettlementJson }
  | { ok: false; kind: "not_found" };

export async function getSettlementDetail(
  db: Database,
  groupId: string,
  settlementId: string,
  callerId: string,
): Promise<GetSettlementResult> {
  if (!(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }
  const [row] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
  if (!row) return { ok: false, kind: "not_found" };
  return { ok: true, settlement: settlementJsonFromRow(row) };
}

export type ReplaceSettlementResult =
  | { ok: true; settlement: SettlementJson }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "voided" }
  | { ok: false; kind: "version_conflict" }
  | { ok: false; kind: "field"; field: string };

export async function replaceSettlement(
  db: Database,
  groupId: string,
  settlementId: string,
  callerId: string,
  parsed: ParsedReplaceSettlement,
): Promise<ReplaceSettlementResult> {
  if (!(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }
  const [row] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
  if (!row) return { ok: false, kind: "not_found" };
  if (row.voidedAt !== null) return { ok: false, kind: "voided" };
  if (row.version !== parsed.version) return { ok: false, kind: "version_conflict" };

  const members = await validateMemberIds(db, groupId, parsed);
  if (!members.ok) {
    return { ok: false, kind: "field", field: members.field };
  }

  const memberIdList = await memberIdsForGroup(db, groupId);
  const nextVersion = row.version + 1;

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(settlements)
        .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
      if (!current || current.voidedAt !== null) {
        throw new ReplaceBlockedError("voided");
      }
      if (current.version !== parsed.version) {
        throw new ReplaceBlockedError("version_conflict");
      }

      await tx
        .update(settlements)
        .set({
          fromMemberId: parsed.fromMemberId,
          toMemberId: parsed.toMemberId,
          amountPaise: parsed.amount,
          occurredOn: parsed.occurredOn,
          note: parsed.note,
          version: nextVersion,
        })
        .where(eq(settlements.id, settlementId));

      await assertGroupBalancesZero(tx as unknown as Database, groupId, memberIdList);

      await tx.insert(activity).values({
        id: `act_${randomBytes(8).toString("hex")}`,
        groupId,
        actorId: callerId,
        kind: "settlement",
        action: "edited",
        subjectId: settlementId,
        snapshot: {
          fromMemberId: parsed.fromMemberId,
          toMemberId: parsed.toMemberId,
          amount: parsed.amount,
          occurredOn: parsed.occurredOn,
          note: parsed.note,
          version: nextVersion,
        },
      });
    });
  } catch (error) {
    if (error instanceof ReplaceBlockedError) {
      if (error.reason === "voided") return { ok: false, kind: "voided" };
      return { ok: false, kind: "version_conflict" };
    }
    throw error;
  }

  const [updated] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
  if (!updated) throw new Error("settlement missing after replace");
  return { ok: true, settlement: settlementJsonFromRow(updated) };
}

export type VoidSettlementResult =
  | { ok: true; settlement: SettlementJson }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "voided" };

export async function voidSettlement(
  db: Database,
  groupId: string,
  settlementId: string,
  callerId: string,
): Promise<VoidSettlementResult> {
  if (!(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }
  const [row] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
  if (!row) return { ok: false, kind: "not_found" };
  if (row.voidedAt !== null) return { ok: false, kind: "voided" };

  const memberIdList = await memberIdsForGroup(db, groupId);

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(settlements)
      .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
    if (!current || current.voidedAt !== null) return;

    await tx
      .update(settlements)
      .set({ voidedAt: new Date() })
      .where(eq(settlements.id, settlementId));

    await assertGroupBalancesZero(tx as unknown as Database, groupId, memberIdList);

    await tx.insert(activity).values({
      id: `act_${randomBytes(8).toString("hex")}`,
      groupId,
      actorId: callerId,
      kind: "settlement",
      action: "voided",
      subjectId: settlementId,
      snapshot: {
        id: settlementId,
        fromMemberId: current.fromMemberId,
        toMemberId: current.toMemberId,
        amount: current.amountPaise,
        voided: true,
      },
    });
  });

  const [updated] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)));
  if (!updated) throw new Error("settlement missing after void");
  return { ok: true, settlement: settlementJsonFromRow(updated) };
}