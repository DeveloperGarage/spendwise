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

export const membersFactory = (overrides: any = {}): any[] =>
  Array.from({ length: 3 }, (_, i) => ({
    ...membersTemplate,
    id: `mock-user-${i}`,
    displayName: `${overrides.groupId} Member ${i + 1}`,
    email: i === 0 ? 'you@example.com' : `member${i + 1}@example.com`,
    ...overrides,
  }));