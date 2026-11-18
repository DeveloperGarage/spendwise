import { readAmount } from "../money.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SPLIT_MODES = new Set(["equal", "exact", "percentage", "shares"]);

export type SplitLine = { memberId: string; amount: number };

export type ParsedCreateExpense = {
  note: string;
  occurredOn: string;
  categoryId: string;
  amount: number;
  splitMode: string;
  split: SplitLine[];
  fundingLines: SplitLine[];
};

export type ParseCreateErr =
  | { kind: "field"; field: string }
  | { kind: "split_refused"; gap: number };

export type ParsedReplaceExpense = ParsedCreateExpense & { version: number };

export function parseReplaceExpenseBody(body: unknown): ParsedReplaceExpense | ParseCreateErr {
  if (body === null || typeof body !== "object") {
    return { kind: "field", field: "body" };
  }
  const version = (body as Record<string, unknown>).version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { kind: "field", field: "version" };
  }
  const created = parseCreateExpenseBody(body);
  if ("kind" in created) return created;
  return { ...created, version };
}

export function parseCreateExpenseBody(body: unknown): ParsedCreateExpense | ParseCreateErr {
  if (body === null || typeof body !== "object") {
    return { kind: "field", field: "body" };
  }
  const record = body as Record<string, unknown>;

  const amount = readAmount(record.amount);
  if (!amount.ok || amount.amount <= 0) {
    return { kind: "field", field: "amount" };
  }

  const categoryId = typeof record.categoryId === "string" ? record.categoryId.trim() : "";
  if (!categoryId) return { kind: "field", field: "categoryId" };

  const occurredOn = typeof record.occurredOn === "string" ? record.occurredOn.trim() : "";
  if (!DATE_RE.test(occurredOn)) return { kind: "field", field: "occurredOn" };

  const note = typeof record.note === "string" ? record.note : "";

  const fundingParsed = parseFundingLines(record.fundingLines);
  if ("field" in fundingParsed) return { kind: "field", field: fundingParsed.field };
  const fundingSum = fundingParsed.lines.reduce((sum, line) => sum + line.amount, 0);
  if (fundingSum !== amount.amount) {
    return { kind: "field", field: "fundingLines" };
  }

  const splitModeRaw = typeof record.splitMode === "string" ? record.splitMode.trim() : "";
  if (!SPLIT_MODES.has(splitModeRaw)) {
    return { kind: "field", field: "splitMode" };
  }

  const splitLines = parseSplitLines(record.split);
  if ("field" in splitLines) return { kind: "field", field: splitLines.field };

  const splitSum = splitLines.lines.reduce((sum, line) => sum + line.amount, 0);
  if (splitSum !== amount.amount) {
    return { kind: "split_refused", gap: amount.amount - splitSum };
  }

  return {
    note,
    occurredOn,
    categoryId,
    amount: amount.amount,
    splitMode: splitModeRaw,
    split: splitLines.lines,
    fundingLines: fundingParsed.lines,
  };
}

function parseFundingLines(fundingLines: unknown): { lines: SplitLine[] } | { field: string } {
  if (!Array.isArray(fundingLines) || fundingLines.length === 0) {
    return { field: "fundingLines" };
  }
  const seen = new Set<string>();
  const lines: SplitLine[] = [];
  for (const row of fundingLines) {
    if (row === null || typeof row !== "object") return { field: "fundingLines" };
    const fundingRow = row as { memberId?: unknown; amount?: unknown; accountId?: unknown };
    if ("accountId" in fundingRow && fundingRow.accountId !== undefined) {
      return { field: "fundingLines" };
    }
    const memberId =
      typeof fundingRow.memberId === "string" ? fundingRow.memberId.trim() : "";
    const amt = readAmount(fundingRow.amount);
    if (!memberId || !amt.ok || amt.amount <= 0) return { field: "fundingLines" };
    if (seen.has(memberId)) return { field: "fundingLines" };
    seen.add(memberId);
    lines.push({ memberId, amount: amt.amount });
  }
  return { lines };
}

function parseSplitLines(split: unknown): { lines: SplitLine[] } | { field: string } {
  if (!Array.isArray(split) || split.length === 0) {
    return { field: "split" };
  }
  const seen = new Set<string>();
  const lines: SplitLine[] = [];
  for (const row of split) {
    if (row === null || typeof row !== "object") return { field: "split" };
    const memberId =
      typeof (row as { memberId?: unknown }).memberId === "string"
        ? (row as { memberId: string }).memberId.trim()
        : "";
    const amt = readAmount((row as { amount?: unknown }).amount);
    if (!memberId || !amt.ok || amt.amount < 0) return { field: "split" };
    if (seen.has(memberId)) return { field: "split" };
    seen.add(memberId);
    lines.push({ memberId, amount: amt.amount });
  }
  return { lines };
}