export type MemberId = string;

export type ParseOk = { ok: true; paise: number };
export type ParseErr = { ok: false; reason: "invalid" };
export type ParseResult = ParseOk | ParseErr;

export type SplitLine = { memberId: MemberId; amount: number };

export type SplitOk = { ok: true; lines: SplitLine[] };
export type SplitErr = { ok: false; gap: number };
export type SplitResult = SplitOk | SplitErr;

export type EqualSplit = { mode: "equal"; memberIds: MemberId[] };
export type SharesSplit = {
  mode: "shares";
  shares: { memberId: MemberId; weight: number }[];
};
export type PercentageSplit = {
  mode: "percentage";
  percentages: { memberId: MemberId; hundredths: number }[];
};
export type ExactSplit = {
  mode: "exact";
  amounts: { memberId: MemberId; amount: number }[];
};
export type SplitInput = EqualSplit | SharesSplit | PercentageSplit | ExactSplit;

export type FundingLine = { memberId: MemberId; amount: number };
export type AllocationLine = { memberId: MemberId; amount: number };

export type ExpenseInput = {
  voided?: boolean;
  fundingLines: FundingLine[];
  allocationLines: AllocationLine[];
};

export type SettlementInput = {
  voided?: boolean;
  fromMemberId: MemberId;
  toMemberId: MemberId;
  amount: number;
};

export type MemberBalance = { memberId: MemberId; balance: number };

export type Transfer = {
  fromMemberId: MemberId;
  toMemberId: MemberId;
  amount: number;
};

export type ExpenseEffect = "lent" | "paid" | "owe";

export type ExpenseDescription = {
  paid: number;
  share: number;
  effect: ExpenseEffect;
  effectAmount: number;
};
