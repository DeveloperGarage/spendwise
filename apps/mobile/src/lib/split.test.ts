import { describe, expect, it } from '@jest/globals';

import { splitByWeights, splitEqually } from './split';

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

describe('splitByWeights', () => {
  it('splits proportionally to the weights', () => {
    expect(splitByWeights(1000, [50, 30, 20])).toEqual([500, 300, 200]);
  });

  it('always sums back to the total despite rounding', () => {
    const shares = splitByWeights(1000, [1, 1, 1]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(1000);
    expect(shares).toEqual([334, 333, 333]);
  });

  it('hands the rounding remainder to the largest fractional parts first', () => {
    const shares = splitByWeights(100, [60, 40]);
    expect(shares).toEqual([60, 40]);
  });

  it('falls back to an equal split when all weights are zero', () => {
    expect(splitByWeights(900, [0, 0, 0])).toEqual([300, 300, 300]);
  });

  it('returns an empty array when there are no participants', () => {
    expect(splitByWeights(500, [])).toEqual([]);
  });
});
