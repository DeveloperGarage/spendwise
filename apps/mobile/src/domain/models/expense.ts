import {Member} from "@/domain/models/members";

type FundingLine = {
  memberId: Member["id"];
  amount: number;
};

export type SplitLine = {
  memberId: Member["id"];
  amount: number;
};

export type PostExpense = {
  note: string,
  occurredOn: string,
  amount: number,
  splitMode: string,
  split: SplitLine[],
  categoryId: string,
  fundingLines: FundingLine[]
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