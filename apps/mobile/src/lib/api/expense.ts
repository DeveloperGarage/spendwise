import { request } from '@/lib/api/clients';
import { ExpenseDetail, PostExpense, PutExpense } from '@/domain/models/expense';

export const saveExpense = async (
  expense: PostExpense,
  groupId: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<void> =>
  request<void>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(expense),
  });

export const getExpenseById = (groupId: string, expenseId: string) =>
  request<ExpenseDetail>(`/groups/${groupId}/expenses/${expenseId}`);

export const updateExpense = (groupId: string, expenseId: string, expense: PutExpense) =>
  request<ExpenseDetail>(`/groups/${groupId}/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(expense),
  });
