import { sql } from "drizzle-orm";

import type { Database } from "../db/client.ts";
import { users } from "../db/schema.ts";
import { findAllowedEmail } from "../auth.ts";

export type ResolvedMember = {
  id: string;
  email: string;
  displayName: string;
};

export type ResolveMemberEmailsErr = {
  ok: false;
  reason: "empty" | "invalid";
};

export function normalizeMemberEmails(raw: unknown, callerEmail: string): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return [];
  const caller = callerEmail.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const email = item.trim().toLowerCase();
    if (!email || email === caller || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export async function resolveMemberEmails(
  db: Database,
  emails: string[],
): Promise<{ ok: true; members: ResolvedMember[] } | ResolveMemberEmailsErr> {
  const members: ResolvedMember[] = [];
  for (const email of emails) {
    const allowed = await findAllowedEmail(db, email);
    if (!allowed) {
      return { ok: false, reason: "invalid" };
    }
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`);
    if (!user) {
      return { ok: false, reason: "invalid" };
    }
    members.push({ id: user.id, email: user.email, displayName: user.displayName });
  }
  return { ok: true, members };
}

export function filterNewMemberEmails(emails: string[], existingMemberEmails: Set<string>) {
  const pending: string[] = [];
  for (const email of emails) {
    if (existingMemberEmails.has(email)) continue;
    pending.push(email);
  }
  return pending;
}
