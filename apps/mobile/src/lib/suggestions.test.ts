import { describe, expect, it } from '@jest/globals';

import { suggestionsInvolving } from './suggestions';

const suggestions = [
  { fromMemberId: 'anil', toMemberId: 'priya', amount: 40000 },
  { fromMemberId: 'sam', toMemberId: 'priya', amount: 20000 },
];

describe('suggestionsInvolving', () => {
  it('keeps payments where the member pays or is paid', () => {
    expect(suggestionsInvolving(suggestions, 'priya')).toEqual(suggestions);
    expect(suggestionsInvolving(suggestions, 'anil')).toEqual([suggestions[0]]);
    expect(suggestionsInvolving(suggestions, 'sam')).toEqual([suggestions[1]]);
  });

  it('returns nothing when the member is in no payment or is unknown', () => {
    expect(suggestionsInvolving(suggestions, 'rita')).toEqual([]);
    expect(suggestionsInvolving(suggestions, undefined)).toEqual([]);
  });
});
