import {Member} from "@/domain/models/members";

type FundingLine = {
  memberId: Member["id"];
  amount: number;
};

export type Expense = {
  note: string,
  occurredOn: string,
  amount: number,
  split: { "mode": string, "memberIds": Member["id"][] },
  categoryId: string,
  fundingLines: FundingLine[]
};
