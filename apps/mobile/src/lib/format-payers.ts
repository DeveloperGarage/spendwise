import { formatPaise } from '@/lib/money';

type PayerRow = { displayName: string; amount: number };

export function formatPayersLine(payers: PayerRow[], gross: number): string {
  if (!payers.length) return `Someone paid ${formatPaise(gross)}`;
  if (payers.length === 1) {
    return `${payers[0].displayName} paid ${formatPaise(payers[0].amount)}`;
  }
  if (payers.length === 2) {
    return `${payers[0].displayName} paid ${formatPaise(payers[0].amount)} · ${payers[1].displayName} paid ${formatPaise(payers[1].amount)}`;
  }
  return `${payers.length} people paid ${formatPaise(gross)}`;
}