type GroupMember = {
  id: string;
  name: string;
}

export type Group = {
  id: string;
  name: string;
  userId: string;
  currency: string;
  balance: number;
  members: GroupMember[];
};
