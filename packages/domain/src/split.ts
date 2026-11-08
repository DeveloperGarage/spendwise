import type { MemberId, SplitInput, SplitLine, SplitResult } from "./types.ts";

function byMemberId(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function largestRemainder(
  gross: number,
  weights: { memberId: MemberId; weight: number }[],
): SplitLine[] {
  const ordered = [...weights].sort((a, b) => byMemberId(a.memberId, b.memberId));
  const totalWeight = ordered.reduce((sum, row) => sum + row.weight, 0);
  const rows = ordered.map((row) => {
    const product = gross * row.weight;
    return {
      memberId: row.memberId,
      amount: Math.trunc(product / totalWeight),
      remainder: product % totalWeight,
    };
  });
  const leftover = gross - rows.reduce((sum, row) => sum + row.amount, 0);
  const rank = [...rows].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return byMemberId(a.memberId, b.memberId);
  });
  for (let i = 0; i < leftover; i += 1) {
    const winner = rank[i];
    const row = rows.find((r) => r.memberId === winner.memberId);
    if (row) row.amount += 1;
  }
  return rows.map(({ memberId, amount }) => ({ memberId, amount }));
}

export function split(gross: number, input: SplitInput): SplitResult {
  if (!Number.isInteger(gross) || gross <= 0) {
    return { ok: false, gap: gross };
  }

  if (input.mode === "equal") {
    if (input.memberIds.length === 0) return { ok: false, gap: gross };
    const weights = input.memberIds.map((memberId) => ({ memberId, weight: 1 }));
    return { ok: true, lines: largestRemainder(gross, weights) };
  }

  if (input.mode === "shares") {
    if (input.shares.length === 0) return { ok: false, gap: gross };
    if (input.shares.some((s) => !Number.isInteger(s.weight) || s.weight <= 0)) {
      return { ok: false, gap: 0 };
    }
    return { ok: true, lines: largestRemainder(gross, input.shares) };
  }

  if (input.mode === "percentage") {
    const total = input.percentages.reduce((sum, p) => sum + p.hundredths, 0);
    if (total !== 10000) return { ok: false, gap: total - 10000 };
    if (input.percentages.some((p) => !Number.isInteger(p.hundredths) || p.hundredths < 0)) {
      return { ok: false, gap: 0 };
    }
    return {
      ok: true,
      lines: largestRemainder(
        gross,
        input.percentages.map((p) => ({ memberId: p.memberId, weight: p.hundredths })),
      ),
    };
  }

  const total = input.amounts.reduce((sum, row) => sum + row.amount, 0);
  if (total !== gross) return { ok: false, gap: total - gross };
  if (input.amounts.some((row) => !Number.isInteger(row.amount) || row.amount < 0)) {
    return { ok: false, gap: 0 };
  }
  return {
    ok: true,
    lines: [...input.amounts]
      .sort((a, b) => byMemberId(a.memberId, b.memberId))
      .map(({ memberId, amount }) => ({ memberId, amount })),
  };
}
