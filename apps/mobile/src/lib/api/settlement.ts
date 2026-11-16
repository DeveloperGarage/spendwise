import { PostSettlement, Settlement } from '@/domain/models/settlement';
import { request } from '@/lib/api/clients';

export const saveSettlement = async (
  body: PostSettlement,
  groupId: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<Settlement> =>
  request<Settlement>(`/groups/${groupId}/settlements`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });