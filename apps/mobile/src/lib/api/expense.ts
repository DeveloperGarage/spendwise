import {request} from "@/lib/api/clients";
import {Expense} from "@/domain/models/expense";

export const saveExpense = async (expense: Expense, groupId: string): Promise<void> =>
  await request<void>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expense),
  })
