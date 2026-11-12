const groupsTemplate = {
  id: 'mock-group-1',
  userId: 'mock-user-1',
  name: 'Mock Group 1',
  members: 3,
  balance: 100,
};
export const groupsFactory = (overrides: any = {}): any[] => {
  const count = overrides.count ?? 5;

  return Array.from({ length: count }, (_, i) => ({
    ...groupsTemplate,
    id: `mock-group-${i + 1}`,
    name: `Mock Group ${i + 1}`,
    ...overrides,
  }));
}
