import type {
  ExpenseInput,
  MemberBalance,
  MemberId,
  SettlementInput,
} from "./types.ts";

export function computeBalances(
  memberIds: MemberId[],
  expenses: ExpenseInput[],
  settlements: SettlementInput[],
): MemberBalance[] {
  const paid = new Map<MemberId, number>();
  const share = new Map<MemberId, number>();
  const sent = new Map<MemberId, number>();
  const received = new Map<MemberId, number>();
  for (const id of memberIds) {
    paid.set(id, 0);
    share.set(id, 0);
    sent.set(id, 0);
    received.set(id, 0);
  }

  for (const expense of expenses) {
    if (expense.voided) continue;
    for (const line of expense.fundingLines) {
      paid.set(line.memberId, (paid.get(line.memberId) ?? 0) + line.amount);
    }
    for (const line of expense.allocationLines) {
      share.set(line.memberId, (share.get(line.memberId) ?? 0) + line.amount);
    }
  }

  for (const settlement of settlements) {
    if (settlement.voided) continue;
    sent.set(
      settlement.fromMemberId,
      (sent.get(settlement.fromMemberId) ?? 0) + settlement.amount,
    );
    received.set(
      settlement.toMemberId,
      (received.get(settlement.toMemberId) ?? 0) + settlement.amount,
    );
  }

  return memberIds.map((memberId) => ({
    memberId,
    balance:
      (paid.get(memberId) ?? 0) -
      (share.get(memberId) ?? 0) +
      (sent.get(memberId) ?? 0) -
      (received.get(memberId) ?? 0),
  }));
}

export function assertZeroSum(balances: MemberBalance[]): boolean {
  return balances.reduce((sum, row) => sum + row.balance, 0) === 0;
}

export function spendingForMember(
  memberId: MemberId,
  expenses: ExpenseInput[],
): number {
  let total = 0;
  for (const expense of expenses) {
    if (expense.voided) continue;
    for (const line of expense.allocationLines) {
      if (line.memberId === memberId) total += line.amount;
    }
  }
  return total;
}
