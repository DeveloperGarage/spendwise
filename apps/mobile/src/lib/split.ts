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

/**
 * Splits `total` proportionally to `weights` (e.g. percentages or custom
 * shares). The returned integer amounts always sum back to `total`; any
 * rounding remainder is handed to the largest fractional parts first.
 *
 * When every weight is zero (nothing entered yet) it falls back to an equal
 * split so the expense still balances.
 */
export function splitByWeights(total: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) return [];

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return splitEqually(total, count);

  const amount = Math.trunc(total);
  const raw = weights.map((weight) => (amount * weight) / totalWeight);
  const shares = raw.map((value) => Math.floor(value));
  let remainder = amount - shares.reduce((sum, share) => sum + share, 0);

  const byLargestFraction = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i += 1) {
    shares[byLargestFraction[i % count].index] += 1;
  }

  return shares;
}
