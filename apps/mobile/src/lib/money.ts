/** Groups digits using the Indian numbering system (e.g. 1234567 -> "12,34,567"). */
export function groupIndian(value: number): string {
  const digits = Math.abs(Math.trunc(value)).toString();
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

/**
 * Formats integer paise from the API (e.g. 156000 → "₹ 1,560.00").
 * Money is paise everywhere except the text a person types; see docs/api.md.
 */
export function formatPaise(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const rest = abs % 100;
  const amount = `${groupIndian(rupees)}.${String(rest).padStart(2, '0')}`;
  return `${sign}₹ ${amount}`;
}
