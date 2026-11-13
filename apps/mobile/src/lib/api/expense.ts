import {request} from "@/lib/api/clients";
import {PostExpense} from "@/domain/models/expense";

export const saveExpense = async (expense: PostExpense, groupId: string): Promise<void> =>
  await request<void>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expense),
  })
