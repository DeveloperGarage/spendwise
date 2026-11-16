import { ActivityItem } from '@/domain/models/activity';
import { formatPaise } from '@/lib/money';

function snapshotString(snapshot: Record<string, unknown>, key: string): string {
  const value = snapshot[key];
  return typeof value === 'string' ? value.trim() : '';
}

function snapshotAmount(snapshot: Record<string, unknown>): number | null {
  const value = snapshot.amount;
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

function expenseLabel(snapshot: Record<string, unknown>): string {
  const note = snapshotString(snapshot, 'note');
  return note || 'an expense';
}

export function formatActivityAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function describeActivityLine(item: ActivityItem): { title: string; subtitle?: string } {
  const who = item.actor.displayName || 'Someone';
  const amount = snapshotAmount(item.snapshot);

  if (item.kind === 'expense') {
    const label = expenseLabel(item.snapshot);
    if (item.action === 'created') {
      const amountPart = amount !== null ? ` · ${formatPaise(amount)}` : '';
      return { title: `${who} added expense ${label}${amountPart}` };
    }
    if (item.action === 'edited') {
      return { title: `${who} edited ${label}` };
    }
    if (item.action === 'voided') {
      return { title: `${who} voided ${label}` };
    }
  }

  if (item.kind === 'settlement') {
    const amountPart = amount !== null ? ` · ${formatPaise(amount)}` : '';
    if (item.action === 'created') {
      return { title: `${who} recorded a payment${amountPart}` };
    }
    if (item.action === 'edited') {
      return { title: `${who} edited a payment${amountPart}` };
    }
    if (item.action === 'voided') {
      return { title: `${who} voided a payment` };
    }
  }

  return { title: `${who} ${item.action} ${item.kind}` };
}