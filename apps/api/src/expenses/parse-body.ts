import type { SplitInput } from "@spendwise/domain";

import { readAmount } from "../money.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedCreateExpense = {
  note: string;
  occurredOn: string;
  categoryId: string;
  amount: number;
  split: SplitInput;
  fundingMemberId: string;
};

export type ParseCreateErr =
  | { kind: "field"; field: string }
  | { kind: "split_refused"; gap: number };

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

  const fundingLines = record.fundingLines;
  if (!Array.isArray(fundingLines) || fundingLines.length !== 1) {
    return { kind: "field", field: "fundingLines" };
  }
  const funding = fundingLines[0];
  if (funding === null || typeof funding !== "object") {
    return { kind: "field", field: "fundingLines" };
  }
  const fundingRow = funding as { memberId?: unknown; amount?: unknown; accountId?: unknown };
  if ("accountId" in fundingRow && fundingRow.accountId !== undefined) {
    return { kind: "field", field: "fundingLines" };
  }
  const fundingMemberId = typeof fundingRow.memberId === "string" ? fundingRow.memberId.trim() : "";
  if (!fundingMemberId) return { kind: "field", field: "fundingLines" };
  const fundingAmount = readAmount(fundingRow.amount);
  if (!fundingAmount.ok || fundingAmount.amount !== amount.amount) {
    return { kind: "field", field: "fundingLines" };
  }

  const splitParsed = parseSplit(record.split);
  if ("field" in splitParsed) return { kind: "field", field: splitParsed.field };

  return {
    note,
    occurredOn,
    categoryId,
    amount: amount.amount,
    split: splitParsed,
    fundingMemberId,
  };
}

function parseSplit(split: unknown): SplitInput | { field: string } {
  if (split === null || typeof split !== "object") {
    return { field: "split" };
  }
  const mode = (split as { mode?: unknown }).mode;
  if (mode === "equal") {
    const memberIds = (split as { memberIds?: unknown }).memberIds;
    if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== "string")) {
      return { field: "split" };
    }
    const trimmed = memberIds.map((id) => (id as string).trim()).filter(Boolean);
    if (trimmed.length === 0) return { field: "split" };
    return { mode: "equal", memberIds: trimmed };
  }
  if (mode === "exact") {
    const raw =
      (split as { amounts?: unknown }).amounts ??
      (split as { lines?: unknown }).lines ??
      (split as { exact?: unknown }).exact;
    if (!Array.isArray(raw)) return { field: "split" };
    const amounts: { memberId: string; amount: number }[] = [];
    for (const row of raw) {
      if (row === null || typeof row !== "object") return { field: "split" };
      const memberId =
        typeof (row as { memberId?: unknown }).memberId === "string"
          ? (row as { memberId: string }).memberId.trim()
          : "";
      const amt = readAmount((row as { amount?: unknown }).amount);
      if (!memberId || !amt.ok) return { field: "split" };
      amounts.push({ memberId, amount: amt.amount });
    }
    if (amounts.length === 0) return { field: "split" };
    return { mode: "exact", amounts };
  }
  if (mode === "percentage") {
    const rows = (split as { percentages?: unknown }).percentages;
    if (!Array.isArray(rows)) return { field: "split" };
    const percentages: { memberId: string; hundredths: number }[] = [];
    for (const row of rows) {
      if (row === null || typeof row !== "object") return { field: "split" };
      const memberId =
        typeof (row as { memberId?: unknown }).memberId === "string"
          ? (row as { memberId: string }).memberId.trim()
          : "";
      const hundredths = (row as { hundredths?: unknown }).hundredths;
      if (!memberId || typeof hundredths !== "number" || !Number.isInteger(hundredths)) {
        return { field: "split" };
      }
      percentages.push({ memberId, hundredths });
    }
    if (percentages.length === 0) return { field: "split" };
    return { mode: "percentage", percentages };
  }
  if (mode === "shares") {
    const rows = (split as { shares?: unknown }).shares;
    if (!Array.isArray(rows)) return { field: "split" };
    const shares: { memberId: string; weight: number }[] = [];
    for (const row of rows) {
      if (row === null || typeof row !== "object") return { field: "split" };
      const memberId =
        typeof (row as { memberId?: unknown }).memberId === "string"
          ? (row as { memberId: string }).memberId.trim()
          : "";
      const weight = (row as { weight?: unknown }).weight;
      if (!memberId || typeof weight !== "number" || !Number.isInteger(weight) || weight <= 0) {
        return { field: "split" };
      }
      shares.push({ memberId, weight });
    }
    if (shares.length === 0) return { field: "split" };
    return { mode: "shares", shares };
  }
  return { field: "split" };
}
