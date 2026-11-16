import { readAmount } from "../money.ts";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedCreateSettlement = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  occurredOn: string;
  note: string;
};

export type ParseSettlementErr = { kind: "field"; field: string };

export type ParsedReplaceSettlement = ParsedCreateSettlement & { version: number };

export function parseReplaceSettlementBody(body: unknown): ParsedReplaceSettlement | ParseSettlementErr {
  if (body === null || typeof body !== "object") {
    return { kind: "field", field: "body" };
  }
  const version = (body as Record<string, unknown>).version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { kind: "field", field: "version" };
  }
  const created = parseCreateSettlementBody(body);
  if ("kind" in created) return created;
  return { ...created, version };
}

export function parseCreateSettlementBody(body: unknown): ParsedCreateSettlement | ParseSettlementErr {
  if (body === null || typeof body !== "object") {
    return { kind: "field", field: "body" };
  }
  const record = body as Record<string, unknown>;

  if ("categoryId" in record || "category" in record) {
    return { kind: "field", field: "categoryId" };
  }
  if ("accountId" in record && record.accountId !== undefined) {
    return { kind: "field", field: "accountId" };
  }

  const amount = readAmount(record.amount);
  if (!amount.ok || amount.amount <= 0) {
    return { kind: "field", field: "amount" };
  }

  const occurredOn = typeof record.occurredOn === "string" ? record.occurredOn.trim() : "";
  if (!DATE_RE.test(occurredOn)) {
    return { kind: "field", field: "occurredOn" };
  }

  const fromMemberId =
    typeof record.fromMemberId === "string" ? record.fromMemberId.trim() : "";
  const toMemberId = typeof record.toMemberId === "string" ? record.toMemberId.trim() : "";
  if (!fromMemberId || !toMemberId) {
    return { kind: "field", field: "fromMemberId" };
  }
  if (fromMemberId === toMemberId) {
    return { kind: "field", field: "toMemberId" };
  }

  const note = typeof record.note === "string" ? record.note : "";

  return {
    fromMemberId,
    toMemberId,
    amount: amount.amount,
    occurredOn,
    note,
  };
}