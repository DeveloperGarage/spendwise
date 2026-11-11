/** Groups digits using the Indian numbering system (e.g. 1234567 -> "12,34,567"). */
export function groupIndian(value: number): string {
  const digits = Math.abs(Math.trunc(value)).toString();
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

/** Formats a rupee amount as "₹ 1,560". Sign is handled by the caller. */
export function formatRupees(value: number): string {
  return `₹ ${groupIndian(value)}`;
}
