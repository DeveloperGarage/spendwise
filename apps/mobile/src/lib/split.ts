/**
 * Pure split-calculation logic. Kept free of UI/React so it can be unit tested
 * in isolation (see split.test.ts). All amounts are integer minor units
 * (e.g. paise) to avoid floating-point rounding errors on money.
 */

/**
 * Splits `total` as evenly as possible across `participantCount` people.
 *
 * Returns an array of integer shares that always sums back to `total`. Any
 * indivisible remainder is spread one unit at a time across the earliest
 * participants, so shares differ by at most 1.
 */
export function splitEqually(total: number, participantCount: number): number[] {
  if (participantCount <= 0) return [];

  const amount = Math.trunc(total);
  const base = Math.trunc(amount / participantCount);
  const remainder = amount - base * participantCount;
  const extraCount = Math.abs(remainder);
  const step = remainder >= 0 ? 1 : -1;

  return Array.from({ length: participantCount }, (_, index) =>
    index < extraCount ? base + step : base,
  );
}
