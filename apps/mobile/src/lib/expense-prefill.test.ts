import { describe, expect, it } from '@jest/globals';

import { percentsFromSplitAmounts, shareWeightsFromAmounts } from './expense-prefill';

describe('expense-prefill', () => {
  it('derives percents that sum to 100', () => {
    expect(percentsFromSplitAmounts([500, 300, 200], 1000)).toEqual([50, 30, 20]);
    expect(percentsFromSplitAmounts([334, 333, 333], 1000).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('derives smallest integer share weights', () => {
    expect(shareWeightsFromAmounts([600, 300, 300])).toEqual([2, 1, 1]);
  });
});