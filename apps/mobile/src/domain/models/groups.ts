export type Group = {
  id: string;
  name: string;
  userId: string;
  members: number;
  /** Positive = you are owed; negative = you owe. In rupees. */
  balance: number;
};


