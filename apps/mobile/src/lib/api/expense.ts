import {request} from "@/lib/api/clients";
import {PostExpense} from "@/domain/models/expense";

export const saveExpense = async (
  expense: PostExpense,
  groupId: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<void> =>
  await request<void>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(expense),
  })
