import { randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import { categories, groups, memberships, users } from "../db/schema.ts";
import { SEED_CATEGORY_NAMES, GROUP_NAME_MAX } from "./constants.ts";
import {
  balanceForCaller,
  loadGroupBalances,
  memberIdsForGroup,
  summarizeBalances,
} from "./journal.ts";
import {
  filterNewMemberEmails,
  normalizeMemberEmails,
  resolveMemberEmails,
} from "./member-emails.ts";

export type GroupMemberJson = {
  id: string;
  displayName: string;
  email: string;
};

export type GroupCardJson = {
  id: string;
  name: string;
  memberCount: number;
  balance: number;
};

export type GroupDetailJson = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  members: GroupMemberJson[];
};

export async function isGroupMember(db: Database, groupId: string, userId: string) {
  const [row] = await db
    .select({ groupId: memberships.groupId })
    .from(memberships)
    .where(and(eq(memberships.groupId, groupId), eq(memberships.userId, userId)));
  return row !== undefined;
}

async function membersForGroup(db: Database, groupId: string): Promise<GroupMemberJson[]> {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.groupId, groupId))
    .orderBy(users.displayName);
  return rows;
}

export async function listGroupMembers(
  db: Database,
  groupId: string,
  callerId: string,
): Promise<GroupMemberJson[] | null> {
  const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
  if (!group) return null;
  if (!(await isGroupMember(db, groupId, callerId))) return null;
  return membersForGroup(db, groupId);
}

export async function getGroupDetail(
  db: Database,
  groupId: string,
  callerId: string,
): Promise<GroupDetailJson | null> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group) return null;
  if (!(await isGroupMember(db, groupId, callerId))) return null;

  const memberIds = await memberIdsForGroup(db, groupId);
  const balanceMap = await loadGroupBalances(db, groupId, memberIds);
  const members = await membersForGroup(db, groupId);

  return {
    id: group.id,
    name: group.name,
    currency: group.currency,
    balance: balanceForCaller(balanceMap, callerId),
    members,
  };
}

async function groupCardForCaller(
  db: Database,
  group: { id: string; name: string },
  callerId: string,
): Promise<GroupCardJson> {
  const memberIds = await memberIdsForGroup(db, group.id);
  const balanceMap = await loadGroupBalances(db, group.id, memberIds);
  return {
    id: group.id,
    name: group.name,
    memberCount: memberIds.length,
    balance: balanceForCaller(balanceMap, callerId),
  };
}

export async function listGroupCards(db: Database, callerId: string) {
  const rows = await db
    .select({ id: groups.id, name: groups.name })
    .from(memberships)
    .innerJoin(groups, eq(memberships.groupId, groups.id))
    .where(eq(memberships.userId, callerId))
    .orderBy(groups.name);

  const cards: GroupCardJson[] = [];
  for (const row of rows) {
    cards.push(await groupCardForCaller(db, row, callerId));
  }
  return cards;
}

export async function getDashboard(db: Database, caller: { id: string; displayName: string }) {
  const cards = await listGroupCards(db, caller.id);
  const summary = summarizeBalances(cards.map((card) => card.balance));
  return {
    user: { id: caller.id, displayName: caller.displayName },
    summary: { currency: "INR" as const, ...summary },
    groups: cards,
  };
}

export type CreateGroupInput = {
  name?: unknown;
  memberEmails?: unknown;
};

export type CreateGroupResult =
  | { ok: true; group: GroupDetailJson }
  | { ok: false; field: "name" | "memberEmails" };

export async function createGroup(
  db: Database,
  caller: { id: string; email: string },
  input: CreateGroupInput,
): Promise<CreateGroupResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > GROUP_NAME_MAX) {
    return { ok: false, field: "name" };
  }

  const emails = normalizeMemberEmails(input.memberEmails, caller.email);
  const resolved = await resolveMemberEmails(db, emails);
  if (!resolved.ok) {
    return { ok: false, field: "memberEmails" };
  }

  const groupId = `g_${randomBytes(8).toString("hex")}`;

  await db.transaction(async (tx) => {
    await tx.insert(groups).values({ id: groupId, name, currency: "INR" });
    await tx.insert(memberships).values({ groupId, userId: caller.id });
    for (const member of resolved.members) {
      await tx.insert(memberships).values({ groupId, userId: member.id });
    }
    for (const categoryName of SEED_CATEGORY_NAMES) {
      await tx.insert(categories).values({
        id: `c_${randomBytes(8).toString("hex")}`,
        groupId,
        name: categoryName,
      });
    }
  });

  const group = await getGroupDetail(db, groupId, caller.id);
  if (!group) {
    throw new Error("group missing after create");
  }
  return { ok: true, group };
}

export type AddMembersInput = { memberEmails?: unknown };

export type AddMembersResult =
  | { ok: true; group: GroupDetailJson }
  | { ok: false; field: "memberEmails" };

export async function addGroupMembers(
  db: Database,
  groupId: string,
  caller: { id: string; email: string },
  input: AddMembersInput,
): Promise<AddMembersResult> {
  if (!(await isGroupMember(db, groupId, caller.id))) {
    return { ok: false, field: "memberEmails" };
  }

  const rawEmails = normalizeMemberEmails(input.memberEmails, caller.email);
  if (!Array.isArray(input.memberEmails) || rawEmails.length === 0) {
    return { ok: false, field: "memberEmails" };
  }

  const existing = await membersForGroup(db, groupId);
  const existingEmails = new Set(existing.map((m) => m.email.trim().toLowerCase()));
  const pending = filterNewMemberEmails(rawEmails, existingEmails);
  if (pending.length === 0) {
    return { ok: false, field: "memberEmails" };
  }

  const resolved = await resolveMemberEmails(db, pending);
  if (!resolved.ok) {
    return { ok: false, field: "memberEmails" };
  }

  const alreadyMemberIds = new Set(existing.map((m) => m.id));
  const toInsert = resolved.members.filter((m) => !alreadyMemberIds.has(m.id));
  if (toInsert.length === 0) {
    return { ok: false, field: "memberEmails" };
  }

  await db.transaction(async (tx) => {
    for (const member of toInsert) {
      await tx.insert(memberships).values({ groupId, userId: member.id });
    }
  });

  const group = await getGroupDetail(db, groupId, caller.id);
  if (!group) {
    throw new Error("group missing after add members");
  }
  return { ok: true, group };
}
