import { ActivityItem } from '@/domain/models/activity';
import { describeActivityLine } from './activity-line';

describe('describeActivityLine', () => {
  const base: Omit<ActivityItem, 'kind' | 'action' | 'snapshot'> = {
    id: 'act_1',
    at: '2026-11-08T10:00:00.000Z',
    actor: { id: 'u_1', displayName: 'Aman' },
    subjectId: 'e_1',
  };

  it('formats expense created', () => {
    const line = describeActivityLine({
      ...base,
      kind: 'expense',
      action: 'created',
      snapshot: { note: 'Dinner', amount: 120000 },
    });
    expect(line.title).toContain('Aman');
    expect(line.title).toContain('Dinner');
    expect(line.title).toContain('1,200.00');
  });

  it('formats expense voided', () => {
    const line = describeActivityLine({
      ...base,
      kind: 'expense',
      action: 'voided',
      snapshot: { note: 'Taxi' },
    });
    expect(line.title).toBe('Aman voided Taxi');
  });
});