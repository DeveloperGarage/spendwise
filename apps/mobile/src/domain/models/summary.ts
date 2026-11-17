export type GroupSummary = {
  currency: string;
  total: number;
  members: { id: string; displayName: string; share: number }[];
  categories: { id: string; name: string; amount: number }[];
};