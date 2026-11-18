type SuggestionParty = {
  fromMemberId: string;
  toMemberId: string;
};

export function suggestionsInvolving<T extends SuggestionParty>(
  suggestions: readonly T[],
  memberId: string | undefined,
): T[] {
  if (!memberId) return [];
  return suggestions.filter(
    (row) => row.fromMemberId === memberId || row.toMemberId === memberId,
  );
}
