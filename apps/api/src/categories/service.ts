import { randomBytes } from "node:crypto";

import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import { categories, expenseAllocationLines, expenses, groups } from "../db/schema.ts";
import { isGroupMember, listGroupMembers } from "../groups/service.ts";

export type CategoryJson = { id: string; name: string };

export type ListCategoriesResult =
  | { ok: true; categories: CategoryJson[] }
  | { ok: false; kind: "not_found" };

export async function listGroupCategories(
  db: Database,
  groupId: string,
  callerId: string,
): Promise<ListCategoriesResult> {
  const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.groupId, groupId))
    .orderBy(asc(categories.name));

  return { ok: true, categories: rows };
}

export type CreateCategoryResult =
  | { ok: true; category: CategoryJson }
  | { ok: false; kind: "not_found" | "field"; field?: "name" | "body" };

export async function createGroupCategory(
  db: Database,
  groupId: string,
  callerId: string,
  name: string,
): Promise<CreateCategoryResult> {
  const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.groupId, groupId), eq(categories.name, name)));
  if (existing) {
    return { ok: false, kind: "field", field: "name" };
  }

  const id = `c_${randomBytes(8).toString("hex")}`;
  await db.insert(categories).values({ id, groupId, name });
  return { ok: true, category: { id, name } };
}

export type PatchCategoryResult =
  | { ok: true; category: CategoryJson }
  | { ok: false; kind: "not_found" | "field"; field?: "name" | "body" };

export async function patchGroupCategory(
  db: Database,
  groupId: string,
  categoryId: string,
  callerId: string,
  name: string,
): Promise<PatchCategoryResult> {
  const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const [row] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.groupId, groupId)));
  if (!row) {
    return { ok: false, kind: "not_found" };
  }

  const [duplicate] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(eq(categories.groupId, groupId), eq(categories.name, name), ne(categories.id, categoryId)),
    );
  if (duplicate) {
    return { ok: false, kind: "field", field: "name" };
  }

  await db.update(categories).set({ name }).where(eq(categories.id, categoryId));
  return { ok: true, category: { id: categoryId, name } };
}

export type GroupSummaryJson = {
  currency: string;
  total: number;
  members: { id: string; displayName: string; share: number }[];
  categories: { id: string; name: string; amount: number }[];
};

export type GetSummaryResult =
  | { ok: true; summary: GroupSummaryJson }
  | { ok: false; kind: "not_found" };

export async function getGroupSummary(
  db: Database,
  groupId: string,
  callerId: string,
): Promise<GetSummaryResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  const members = await listGroupMembers(db, groupId, callerId);
  if (!members) {
    return { ok: false, kind: "not_found" };
  }

  const liveExpenses = await db
    .select({ id: expenses.id, grossPaise: expenses.grossPaise })
    .from(expenses)
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.voidedAt)));

  const expenseIds = liveExpenses.map((row) => row.id);
  let total = 0;
  for (const row of liveExpenses) {
    total += row.grossPaise;
  }

  const shareByMember = new Map<string, number>();
  for (const member of members) {
    shareByMember.set(member.id, 0);
  }

  const amountByCategory = new Map<string, number>();
  const categoryNames = new Map<string, string>();

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.groupId, groupId));
  for (const cat of categoryRows) {
    categoryNames.set(cat.id, cat.name);
    amountByCategory.set(cat.id, 0);
  }

  if (expenseIds.length > 0) {
    const allocationRows = await db
      .select({
        memberId: expenseAllocationLines.memberId,
        categoryId: expenseAllocationLines.categoryId,
        amountPaise: expenseAllocationLines.amountPaise,
      })
      .from(expenseAllocationLines)
      .where(inArray(expenseAllocationLines.expenseId, expenseIds));

    for (const line of allocationRows) {
      shareByMember.set(line.memberId, (shareByMember.get(line.memberId) ?? 0) + line.amountPaise);
      amountByCategory.set(
        line.categoryId,
        (amountByCategory.get(line.categoryId) ?? 0) + line.amountPaise,
      );
    }
  }

  const memberSummary = members.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    share: shareByMember.get(member.id) ?? 0,
  }));

  const categoriesSummary = [...amountByCategory.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({
      id,
      name: categoryNames.get(id) ?? "",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));

  return {
    ok: true,
    summary: {
      currency: group.currency,
      total,
      members: memberSummary,
      categories: categoriesSummary,
    },
  };
}