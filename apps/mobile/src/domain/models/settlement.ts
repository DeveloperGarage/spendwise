export type PostSettlement = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  occurredOn: string;
  note: string;
};

export type Settlement = PostSettlement & {
  id: string;
  version: number;
  voided: boolean;
};