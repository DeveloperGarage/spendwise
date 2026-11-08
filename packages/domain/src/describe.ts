import type { ExpenseDescription, ExpenseInput, MemberId } from "./types.ts";

export function describeExpenseForMember(
  expense: ExpenseInput,
  memberId: MemberId,
): ExpenseDescription {
  const paid = expense.fundingLines
    .filter((line) => line.memberId === memberId)
    .reduce((sum, line) => sum + line.amount, 0);
  const share = expense.allocationLines
    .filter((line) => line.memberId === memberId)
    .reduce((sum, line) => sum + line.amount, 0);

  if (paid > share) {
    return { paid, share, effect: "lent", effectAmount: paid - share };
  }
  if (paid < share) {
    return { paid, share, effect: "owe", effectAmount: share - paid };
  }
  return { paid, share, effect: "paid", effectAmount: 0 };
}
