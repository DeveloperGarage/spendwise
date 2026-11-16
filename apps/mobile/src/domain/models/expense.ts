import {Member} from "@/domain/models/members";

type FundingLine = {
  memberId: Member["id"];
  amount: number;
};

export type SplitLine = {
  memberId: Member["id"];
  amount: number;
};

/** The split modes the API accepts (see apps/api/src/expenses/parse-body.ts). */
export type SplitMode = "equal" | "exact" | "percentage" | "shares";

export type PostExpense = {
  note: string,
  occurredOn: string,
  amount: number,
  splitMode: SplitMode,
  split: SplitLine[],
  categoryId: string,
  fundingLines: FundingLine[]
};

/** The resolved output of the split editor: the chosen mode + per-participant amounts. */
export type SplitValue = {
  splitMode: SplitMode;
  split: SplitLine[];
};

export type Expense = {
  id: string,
  note: string,
  occurredOn: string,
  amount: number,
  version: number,
  payer: { id: string, displayName: string },
  caller: { paid: number, share: number, effect: string, effectAmount: number },
  category: { id: string, name: string },
  voided: boolean
};

export type GetExpense = {
  expenses: Expense[],
  nextCursor: string | null
};