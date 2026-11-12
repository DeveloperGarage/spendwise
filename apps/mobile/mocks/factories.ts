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

const expensesTemplate = [
  { id: 'e1', title: "Dinner at Britto's", payerName: 'You', amountPaid: 1200, net: 800 },
  { id: 'e2', title: 'Scooter rental', payerName: 'Riya', amountPaid: 900, net: -300 },
  { id: 'e3', title: 'Beach shack lunch', payerName: 'You', amountPaid: 1600, net: 1060 },
  { id: 'e4', title: 'Cab from airport', payerName: 'Sam', amountPaid: 1400, net: -350 },
];

export const expensesFactory = (overrides: any = {}): any[] =>
  expensesTemplate.map((expense) => ({ groupId: 'mock-group-1', ...expense, ...overrides }));

const membersTemplate =
  { id: 'm1', displayName: 'You', email: 'you@example.com' }

export const membersFactory = (overrides: any = {}): any[] =>
  Array.from({ length: 3 }, (_, i) => ({
    ...membersTemplate,
    id: `m${i + 1}`,
    displayName: i === 0 ? 'You' : `Member ${i + 1}`,
    email: i === 0 ? 'you@example.com' : `member${i + 1}@example.com`,
    ...overrides,
  }));