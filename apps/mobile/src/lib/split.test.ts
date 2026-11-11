import { describe, expect, it } from '@jest/globals';

import { splitEqually } from './split';

describe('splitEqually', () => {
  it('divides an evenly divisible total into identical shares', () => {
    expect(splitEqually(1200, 3)).toEqual([400, 400, 400]);
  });

  it('spreads the remainder across the earliest participants', () => {
    const shares = splitEqually(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(1000);
  });

  it('always sums back to the original total', () => {
    const shares = splitEqually(100, 7);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
  });

  it('handles a single participant', () => {
    expect(splitEqually(500, 1)).toEqual([500]);
  });

  it('returns an empty array when there are no participants', () => {
    expect(splitEqually(500, 0)).toEqual([]);
  });

  it('distributes a negative total without losing units', () => {
    const shares = splitEqually(-1000, 3);
    expect(shares).toEqual([-334, -333, -333]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(-1000);
  });
});
