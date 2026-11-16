import { and, desc, eq, lt, or } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import { activity, groups, users } from "../db/schema.ts";
import { isGroupMember } from "../groups/service.ts";

export type ActivityItemJson = {
  id: string;
  at: string;
  actor: { id: string; displayName: string };
  kind: string;
  action: string;
  subjectId: string;
  snapshot: Record<string, unknown>;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function encodeCursor(at: Date, id: string): string {
  return `${at.toISOString()}\t${id}`;
}

function decodeCursor(cursor: string): { at: Date; id: string } | null {
  const tab = cursor.indexOf("\t");
  if (tab < 0) return null;
  const at = new Date(cursor.slice(0, tab));
  const id = cursor.slice(tab + 1);
  if (Number.isNaN(at.getTime()) || !id) return null;
  return { at, id };
}

export type ListActivityResult =
  | { ok: true; activities: ActivityItemJson[]; nextCursor: string | null }
  | { ok: false; kind: "not_found" };

export async function listGroupActivity(
  db: Database,
  groupId: string,
  callerId: string,
  options: { limit?: number; cursor?: string },
): Promise<ListActivityResult> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
  if (!group || !(await isGroupMember(db, groupId, callerId))) {
    return { ok: false, kind: "not_found" };
  }

  let limit = options.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const decoded = options.cursor ? decodeCursor(options.cursor) : null;
  if (options.cursor && !decoded) {
    return { ok: true, activities: [], nextCursor: null };
  }

  const conditions = [eq(activity.groupId, groupId)];
  if (decoded) {
    conditions.push(
      or(
        lt(activity.at, decoded.at),
        and(eq(activity.at, decoded.at), lt(activity.id, decoded.id)),
      )!,
    );
  }

  const rows = await db
    .select({
      id: activity.id,
      at: activity.at,
      actorId: activity.actorId,
      displayName: users.displayName,
      kind: activity.kind,
      action: activity.action,
      subjectId: activity.subjectId,
      snapshot: activity.snapshot,
    })
    .from(activity)
    .innerJoin(users, eq(activity.actorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(activity.at), desc(activity.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  const activities: ActivityItemJson[] = page.map((row) => ({
    id: row.id,
    at: row.at.toISOString(),
    actor: { id: row.actorId, displayName: row.displayName },
    kind: row.kind,
    action: row.action,
    subjectId: row.subjectId,
    snapshot:
      row.snapshot !== null && typeof row.snapshot === "object" && !Array.isArray(row.snapshot)
        ? (row.snapshot as Record<string, unknown>)
        : {},
  }));

  const nextCursor =
    hasMore && page.length > 0
      ? encodeCursor(page[page.length - 1].at, page[page.length - 1].id)
      : null;

  return { ok: true, activities, nextCursor };
}