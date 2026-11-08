import type { MemberBalance, Transfer } from "./types.ts";

function byAmountThenId(
  a: { memberId: string; amount: number },
  b: { memberId: string; amount: number },
): number {
  if (b.amount !== a.amount) return b.amount - a.amount;
  if (a.memberId < b.memberId) return -1;
  if (a.memberId > b.memberId) return 1;
  return 0;
}

/**
 * Greedy settle-up. Creditors and debtors are each sorted by signed amount
 * descending, then member id ascending. Debtors have negative balances, so
 * the least-negative debt is first among equals of different sizes; equal
 * debts still break on member id.
 */
export function suggestTransfers(balances: MemberBalance[]): Transfer[] {
  const creditors = balances
    .filter((row) => row.balance > 0)
    .map((row) => ({ memberId: row.memberId, amount: row.balance }))
    .sort(byAmountThenId);
  const debtors = balances
    .filter((row) => row.balance < 0)
    .map((row) => ({ memberId: row.memberId, amount: row.balance }))
    .sort(byAmountThenId);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debit = -debtors[i].amount;
    const credit = creditors[j].amount;
    const amount = debit < credit ? debit : credit;
    transfers.push({
      fromMemberId: debtors[i].memberId,
      toMemberId: creditors[j].memberId,
      amount,
    });
    debtors[i].amount += amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i += 1;
    if (creditors[j].amount === 0) j += 1;
  }
  return transfers;
}
