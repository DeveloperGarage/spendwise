const groupsTemplate = {
  id: 'mock-group-1',
  userId: 'mock-user-1',
  name: 'Mock Group 1',
  memberCount: 3,
  balance: 100,
};
export const groupsFactory = (overrides: any = {}, count?: number): any[] => {
  const groupsCount = count ?? 5;

  return Array.from({ length: groupsCount }, (_, i) => ({
    ...groupsTemplate,
    id: `mock-group-${i + 1}`,
    name: `Mock Group ${i + 1}`,
    ...overrides,
  }));
}

const expensesTemplate = {
  "expenses": [
    {
      "id": "e_1",
      "version": 1,
      "note": "Dinner at Britto's",
      "occurredOn": "2026-11-07",
      "category": { "id": "c_food", "name": "Food" },
      "amount": 120000,
      "payer": { "id": "u_1", "displayName": "Aman" },
      "caller": { "paid": 120000, "share": 40000, "effect": "lent", "effectAmount": 80000 },
      "voided": false
    }
  ],
  "nextCursor": null
}

export const expensesFactory = (overrides: any = {}): any =>
  ({expenses: expensesTemplate.expenses.map((expense) => ({groupId: 'mock-group-1', ...expense, ...overrides})),
  nextCursor: expensesTemplate.nextCursor
})

const membersTemplate =
  { id: 'm1', displayName: 'You', email: 'you@example.com' }

const SEED_CATEGORIES = [
  { id: 'c_food', name: 'Food' },
  { id: 'c_stay', name: 'Stay' },
  { id: 'c_transport', name: 'Transport' },
  { id: 'c_activities', name: 'Activities' },
  { id: 'c_shopping', name: 'Shopping' },
  { id: 'c_groceries', name: 'Groceries' },
  { id: 'c_other', name: 'Other' },
];

export const categoriesFactory = () => ({ categories: SEED_CATEGORIES });

export const summaryFactory = (overrides: Partial<{ total: number }> = {}) => ({
  currency: 'INR',
  total: overrides.total ?? 320000,
  members: [
    { id: 'mock-user-1', displayName: 'Mock User', share: 120000 },
    { id: 'mock-user-2', displayName: 'Alex', share: 100000 },
    { id: 'mock-user-3', displayName: 'Sam', share: 100000 },
  ],
  categories: [
    { id: 'c_food', name: 'Food', amount: 200000 },
    { id: 'c_transport', name: 'Transport', amount: 120000 },
  ],
});

export const membersFactory = (overrides: any = {}): any[] =>
  Array.from({ length: 3 }, (_, i) => ({
    ...membersTemplate,
    id: `mock-user-${i}`,
    displayName: `${overrides.groupId} Member ${i + 1}`,
    email: i === 0 ? 'you@example.com' : `member${i + 1}@example.com`,
    ...overrides,
  }));