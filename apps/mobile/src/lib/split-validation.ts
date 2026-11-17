import { SplitMode } from '@/domain/models/expense';

/** Whether mode-specific inputs are ready to save (exact still relies on line sum in parent). */
export function splitInputsValid(
  mode: SplitMode,
  participantIds: string[],
  percentByMember: Record<string, number>,
  sharesByMember: Record<string, number>,
): boolean {
  if (participantIds.length === 0) return false;
  if (mode === 'equal' || mode === 'exact') return true;
  if (mode === 'percentage') {
    const total = participantIds.reduce((sum, id) => sum + (percentByMember[id] ?? 0), 0);
    return total === 100;
  }
  if (mode === 'shares') {
    return participantIds.every((id) => (sharesByMember[id] ?? 0) >= 1);
  }
  return false;
}

export function percentTotal(
  participantIds: string[],
  percentByMember: Record<string, number>,
): number {
  return participantIds.reduce((sum, id) => sum + (percentByMember[id] ?? 0), 0);
}