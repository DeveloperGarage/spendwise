export type GroupBalanceMember = {
  id: string;
  displayName: string;
  balance: number;
};

export type SettleSuggestion = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};

export type GroupBalances = {
  members: GroupBalanceMember[];
  suggestion: SettleSuggestion[];
};