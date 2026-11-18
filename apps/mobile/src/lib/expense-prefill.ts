import { ExpenseDetail, SplitMode } from '@/domain/models/expense';
import type { ExpenseSplitInitial } from '@/components/expense-split-editor/expense-split-editor';
import type { ExpenseFundingInitial } from '@/components/expense-funding-editor/expense-funding-editor';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = y;
    y = x % y;
    x = next;
  }
  return x || 1;
}

function gcdMany(values: number[]): number {
  return values.reduce((acc, value) => gcd(acc, value), values[0] ?? 1);
}

/** Integer percents that sum to 100, derived from stored allocation paise. */
export function percentsFromSplitAmounts(amounts: number[], total: number): number[] {
  if (total <= 0 || amounts.length === 0) return amounts.map(() => 0);
  const raw = amounts.map((amount) => Math.floor((amount * 100) / total));
  const sum = raw.reduce((part, value) => part + value, 0);
  const gap = 100 - sum;
  if (gap !== 0) {
    let best = 0;
    for (let index = 1; index < amounts.length; index += 1) {
      if (amounts[index] > amounts[best]) best = index;
    }
    raw[best] += gap;
  }
  return raw;
}

export function shareWeightsFromAmounts(amounts: number[]): number[] {
  const positive = amounts.filter((amount) => amount > 0);
  if (positive.length === 0) return amounts.map(() => 1);
  const divisor = gcdMany(positive);
  return amounts.map((amount) => (amount > 0 ? amount / divisor : 0));
}

/** Build funding editor seed from GET expense detail funding lines. */
export function fundingInitialFromDetail(
  fundingLines: ExpenseDetail['fundingLines'],
): ExpenseFundingInitial {
  const selected: Record<string, boolean> = {};
  const amounts: Record<string, number> = {};
  for (const line of fundingLines) {
    selected[line.memberId] = true;
    amounts[line.memberId] = line.amount;
  }
  return { selected, amounts };
}

/** Build split editor seed from GET expense detail and full group roster ids. */
export function splitInitialFromDetail(
  detail: ExpenseDetail,
  rosterMemberIds: string[],
): ExpenseSplitInitial {
  const splitIds = new Set(detail.split.map((line) => line.memberId));
  const selected: Record<string, boolean> = {};
  for (const id of rosterMemberIds) {
    selected[id] = splitIds.has(id);
  }

  const mode = detail.splitMode as SplitMode;
  const amounts = detail.split.map((line) => line.amount);
  const byMember: Record<string, number> = {};
  detail.split.forEach((line) => {
    byMember[line.memberId] = line.amount;
  });

  const exactInput: Record<string, number> = { ...byMember };
  const percentInput: Record<string, number> = {};
  const sharesInput: Record<string, number> = {};

  const orderedAmounts = detail.split.map((line) => line.amount);
  const percents = percentsFromSplitAmounts(orderedAmounts, detail.amount);
  const weights = shareWeightsFromAmounts(orderedAmounts);

  detail.split.forEach((line, index) => {
    percentInput[line.memberId] = percents[index] ?? 0;
    sharesInput[line.memberId] = weights[index] ?? 0;
  });

  return {
    mode,
    selected,
    exactInput,
    percentInput,
    sharesInput,
  };
}