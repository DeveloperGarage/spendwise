import { formatPaise } from './money';

describe('formatPaise', () => {
  it('formats paise with rupee grouping', () => {
    expect(formatPaise(156000)).toBe('₹ 1,560.00');
    expect(formatPaise(-40000)).toBe('-₹ 400.00');
    expect(formatPaise(3334)).toBe('₹ 33.34');
  });
});