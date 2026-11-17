import { describe, expect, it } from '@jest/globals';

import { percentTotal, splitInputsValid } from './split-validation';

describe('splitInputsValid', () => {
  const participants = ['a', 'b'];

  it('requires at least one participant', () => {
    expect(splitInputsValid('equal', [], {}, {})).toBe(false);
  });

  it('accepts equal and exact when participants exist', () => {
    expect(splitInputsValid('equal', participants, {}, {})).toBe(true);
    expect(splitInputsValid('exact', participants, {}, {})).toBe(true);
  });

  it('requires percentages to sum to 100', () => {
    expect(splitInputsValid('percentage', participants, { a: 50, b: 30 }, {})).toBe(false);
    expect(splitInputsValid('percentage', participants, { a: 50, b: 50 }, {})).toBe(true);
  });

  it('requires each selected member to have at least one share', () => {
    expect(splitInputsValid('shares', participants, {}, { a: 2, b: 0 })).toBe(false);
    expect(splitInputsValid('shares', participants, {}, { a: 2, b: 1 })).toBe(true);
  });
});

describe('percentTotal', () => {
  it('sums selected member percentages', () => {
    expect(percentTotal(['a', 'b'], { a: 40, b: 35 })).toBe(75);
  });
});